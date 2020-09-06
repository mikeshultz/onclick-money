import re
import json
import redis
import tornado.web
from datetime import datetime, timedelta
from secrets import token_hex
from eth_utils.hexadecimal import remove_0x_prefix

TOKEN_BYTES = 32
HEX_PATTERN = r'^(0x)?([A-Fa-f0-9]{64})$'
MIN_CLICK_DURATION = timedelta(milliseconds=500)

_cached_redis = None
# in-memory click tracking
_last_click = dict()
_token_lock = dict()

def log(msg):
    # TODO: replace with proper logging
    print('### {}'.format(msg))

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

class MainHandler(tornado.web.RequestHandler):
    def write_json(self, v):
        self.write(json.dumps(v))

    def get(self):
        self.write_json({
            'success': True
        })

class ClicksHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.redis = get_redis()

    def write_json(self, v):
        self.write(json.dumps(v))

    def get(self, token):
        clicks = rgetint(self.redis, token, 0)

        self.write_json({
            'success': True,
            'clicks': clicks
        })

class ClickHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.redis = get_redis()

    def write_json(self, v):
        self.write(json.dumps(v))

    def post(self):
        """ Handle POST request """

        if not self.request.body:
            log('Missing body')
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
        if token is not None:
            if _token_lock.get(token):
                log('Token locked: {}'.format(token))
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

            if (
                _last_click.get(token)
                and now - _last_click[token] < MIN_CLICK_DURATION
            ):
                log('Clicking too often')

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
            log('ERROR: Given token is invalid: {}'.format(token))
        
        # Generate token if needed
        if token is None or clicks == 0:
            token = token_hex(TOKEN_BYTES)

            log('Created token: {}'.format(token))

        # Increment clicks
        clicks += 1
        self.redis.incr(token)
        _last_click[token] = now

        # Unlock token
        _token_lock[token] = False

        self.write_json({
            'success': True,
            'clicks': clicks,
            'token': token,
        })

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/click", ClickHandler),
        (r"/clicks/([A-Fa-f0-9]+)", ClicksHandler),
    ])
