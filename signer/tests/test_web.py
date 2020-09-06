import re
import time
import json
import pytest
from tornado.httpclient import HTTPRequest
from onclick_signer.web import HEX_PATTERN, make_app

def http_get(client, url):
    req = HTTPRequest(url=url)
    return client.fetch(req)

def http_post(client, url, body):
    req = HTTPRequest(
        url=url,
        method='POST',
        body=json.dumps(body),
        headers={ 'Content-Type': 'application/json' },
    )
    return client.fetch(req)

@pytest.fixture
def app():
    return make_app()

@pytest.mark.gen_test
def test_root(http_client, base_url):
    response = yield http_client.fetch(base_url)
    assert response.code == 200

@pytest.mark.gen_test
def test_click(http_client, base_url):
    response = yield http_post(http_client, "{}/click".format(base_url), {})

    assert response.code == 200

    body = json.loads(response.body)
    assert body.get('success')
    assert body.get('clicks') == 1
    assert body.get('token') is not None
    assert re.match(HEX_PATTERN, body['token']) is not None

@pytest.mark.gen_test
def test_multiple_clicks(http_client, base_url):
    response = yield http_post(
        http_client,
        "{}/click".format(base_url),
        { 'name': 'first' }
    )

    assert response.code == 200
    assert response.body is not None

    body = json.loads(response.body)

    assert body.get('success'), "Request failed: {}".format(body.get('message'))
    assert body.get('clicks') == 1
    assert body.get('token') is not None
    assert re.match(HEX_PATTERN, body['token']) is not None

    token = body['token']

    # Do not want to trigger rate limiting
    time.sleep(0.5)

    response2 = yield http_post(
        http_client,
        "{}/click".format(base_url),
        { 'name': 'second', 'token': token }
    )

    assert response2.code == 200

    body = json.loads(response2.body)

    assert body.get('success')
    assert body.get('clicks') == 2

    # Do not want to trigger rate limiting
    time.sleep(0.5)

    response3 = yield http_post(
        http_client,
        "{}/click".format(base_url),
        { 'name': 'third', 'token': token }
    )

    assert response3.code == 200

    body = json.loads(response3.body)

    assert body.get('success')
    assert body.get('clicks') == 3

    # Do not want to trigger rate limiting
    time.sleep(0.5)

    # Get stats
    response_stats = yield http_get(http_client, "{}/clicks/{}".format(base_url, token))

    assert response_stats.code == 200

    body = json.loads(response_stats.body)

    assert body.get('success')
    assert body.get('clicks') == 3
    assert body.get('token') is None

# TODO: Test concurrency prevention