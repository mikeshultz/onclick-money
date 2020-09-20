import re
import os
import json
import redis
import tornado.web
import logging
from pathlib import Path
from datetime import datetime, timedelta
from secrets import token_hex
from eth_account import Account
from eth_account.messages import defunct_hash_message
from eth_utils.address import is_address
from eth_utils.hexadecimal import add_0x_prefix, remove_0x_prefix
from web3 import Web3

#from onclick_signer.account import create_account
# TODO: Move this to a separate package?
from solidbyte.accounts import Accounts

TOKEN_BYTES = 32
HEX_PATTERN = r'^(0x)?([A-Fa-f0-9]{64})$'
MIN_CLICK_DURATION = timedelta(milliseconds=500)
KEYSTORE_DIR = Path(
    os.environ.get('ETHEREUM_KEYSTORE', '~/.ethereum/keystore')
).expanduser().resolve()
ENCRYPTION_PASSPHRASE = os.environ.get('ENCRYPTION_PASSPHRASE')

_cached_redis = None
# in-memory click tracking
_last_click = dict()
_token_lock = dict()

log = logging.getLogger().getChild('web')
log.setLevel('DEBUG')

def get_redis():
    global _cached_redis
    if _cached_redis is None:
        # TODO this should probably be configurable
        _cached_redis = redis.Redis(host='localhost', port=6379, db=0)
    return _cached_redis

def is_valid_token(tok):
    try:
        assert tok is not None
        assert type(tok) == str
        assert len(remove_0x_prefix(tok)) == 64
        assert re.match(HEX_PATTERN, tok) is not None
        return True
    except AssertionError:
        return False

def rgetint(r, key, default):
    v = r.get(key)
    if v:
        return int(v)
    return int(default)

def create_claim(recipient, uid, amount, contract_address):
    return Web3.solidityKeccak(
        ['address', 'bytes32', 'uint256', 'address'],
        [recipient, uid, amount, contract_address]
    )


class JSONRequestHandler(tornado.web.RequestHandler):
    def set_default_headers(self, *args, **kwargs):
        # TODO: Should we care about CORS Origin?
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def write_json(self, v):
        self.write(json.dumps(v))

class MainHandler(JSONRequestHandler):
    def get(self):
        self.write_json({
            'success': True
        })

class ClicksHandler(JSONRequestHandler):
    def initialize(self):
        self.redis = get_redis()

    def get(self, token):
        clicks = rgetint(self.redis, token, 0)

        self.write_json({
            'success': True,
            'clicks': clicks
        })

class ClickHandler(JSONRequestHandler):
    def initialize(self):
        self.redis = get_redis()

    def post(self):
        """ Handle POST request """

        if not self.request.body:
            log.warning('Missing body')
            self.set_status(400)
            self.write_json({
                'success': False,
                'clicks': None,
                'token': '',
            })
            return

        now = datetime.now()
        req = json.loads(self.request.body)
        token = req.get('token')
        clicks = 0

        # No concurrent requests
        if not token:
            if _token_lock.get(token):
                log.warning('Token locked: {}'.format(token))
                self.write_json({
                    'success': False,
                    'clicks': None,
                    'token': token,
                })
                return

            # Lock token
            _token_lock[token] = True

        if is_valid_token(token):
            # Verify it exists
            clicks = rgetint(self.redis, token, 0)

            # Rate limiting by both token and IP address
            if (
                (
                    _last_click.get(token)
                    and now - _last_click[token] < MIN_CLICK_DURATION
                )
                or (
                    _last_click.get(self.request.remote_ip)
                    and now - _last_click[self.request.remote_ip] < MIN_CLICK_DURATION
                )
            ):
                log.warning('Clicking too often')

                self.set_status(429)
                self.write_json({
                    'success': False,
                    'clicks': clicks,
                    'token': token,
                })

                # Unlock token
                _token_lock[token] = False

                return
        elif token is not None:
            log.error('ERROR: Given token is invalid: {}'.format(token))
        
        # Generate token if needed, do not just accept what's given
        if token is None or clicks == 0:
            if token is not None:
                # Unlock the bad token
                _token_lock[token] = False

            # Recreate the token to send back to the client
            token = token_hex(TOKEN_BYTES)

            log.warning('Created token: {}'.format(token))

        # Increment clicks
        clicks += 1
        self.redis.incr(token)
        _last_click[token] = now
        _last_click[self.request.remote_ip] = now

        # Unlock token
        _token_lock[token] = False

        log.info('Clicked.')

        self.write_json({
            'success': True,
            'clicks': clicks,
            'token': token,
        })

class ClaimHandler(JSONRequestHandler):
    def initialize(self):
        self.redis = get_redis()
        self.accounts = Accounts(keystore_dir=os.environ.get('ETHEREUM_KEYSTORE'))

        stored_accounts = self.accounts.get_accounts()
        passphrase = ENCRYPTION_PASSPHRASE
        account = None

        if not passphrase:
            raise ValueError('ENCRYPTION_PASSPHRASE must be defined')

        if not stored_accounts:
            account = self.accounts.create_account(passphrase)
        elif len(stored_accounts) > 1:
            raise NotImplementedError('TODO: Support multiple accounts in keystore...')
        else:
            account = stored_accounts[0].address

        log.info('Using account {} as signer'.format(account))

        privkey = self.accounts.unlock(account, passphrase)
        self.signer_account_privkey = privkey
        self.signer_account_address = account

    def post(self):
        """ Handle POST request """

        if not self.request.body:
            log.warning('Missing body')
            self.set_status(400)
            self.write_json({
                'success': False,
                'clicks': None,
                'token': '',
            })
            return

        req = json.loads(self.request.body)
        token = req.get('token')
        recipient = req.get('recipient')
        contract = req.get('contract')

        invalids = []
        if not is_valid_token(token):
            invalids.append('token')
        if not recipient or not is_address(recipient):
            invalids.append('recipient')
        if not contract or not is_address(contract):
            invalids.append('contract')

        recipient = Web3.toChecksumAddress(recipient)
        contract = Web3.toChecksumAddress(contract)

        if len(invalids) > 0:
            log.warning('Invalid input: {}'.format(', '.join(invalids)))

            self.set_status(400)
            self.write_json({
                'success': False,
                'clicks': None,
                'token': '',
                'message': 'Invalid input'
            })
            return

        # Verify it exists
        clicks = rgetint(self.redis, token, 0)

        if not clicks:
            log.warning('Token has no clicks')
            self.write_json({
                'success': False,
                'clicks': None,
                'token': token,
                'message': 'Try clicking first'
            })
            return

        log.info('create_claim({}, {}, {}, {})'.format(
            recipient,
            add_0x_prefix(token),
            clicks * int(1e18),
            contract
        ))

        # Assemble claim
        claim = create_claim(
            recipient,
            add_0x_prefix(token),
            clicks * int(1e18),
            contract
        )
        prefixed_claim_hash = defunct_hash_message(claim)
        # Docstring for this function sugests this does not prefix messages, so
        # we're prefixing above
        signed = self.accounts.eth_account.signHash(
            prefixed_claim_hash,
            self.signer_account_privkey
        )

        self.write_json({
            'success': True,
            'clicks': clicks,
            'token': token,
            'claim': claim.hex(),
            'signature': signed.signature.hex(),
            'contract': contract,
        })

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/claim", ClaimHandler),
        (r"/click", ClickHandler),
        (r"/clicks/([A-Fa-f0-9]+)", ClicksHandler),
    ])
