import sys
import tornado.ioloop
from argparse import ArgumentParser
from onclick_signer.web import make_app

def parse_args(argv):
    parser = ArgumentParser()
    parser.add_argument('-p', '--port', help='Port to listen on', type=int,
                        default=8888)
    return parser.parse_args(argv)

def main(argv=sys.argv[1:]):
    args = parse_args(argv)

    app = make_app()
    app.listen(args.port)
    tornado.ioloop.IOLoop.current().start()
