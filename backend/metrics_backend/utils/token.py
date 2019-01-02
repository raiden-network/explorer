from web3.contract import Contract
from web3.exceptions import BadFunctionCallOutput

from metrics_backend.model import TokenInfo


def get_token_name(token_contract: Contract) -> str:
    try:
        return token_contract.functions.name().call()
    except BadFunctionCallOutput:
        return ''
    # temporary fix for #138, until we understand why this happens
    except ValueError:
        return ''


def get_token_symbol(token_contract: Contract) -> str:
    try:
        return token_contract.functions.symbol().call()
    except BadFunctionCallOutput:
        return ''
    # temporary fix for #138, until we understand why this happens
    except (ValueError, OverflowError):
        return ''


def get_token_decimals(token_contract: Contract) -> int:
    try:
        return token_contract.functions.decimals().call()
    except BadFunctionCallOutput:
        return 18
    # temporary fix for #138, until we understand why this happens
    except ValueError:
        return 18


def get_token_info(token_contract: Contract) -> TokenInfo:
    return TokenInfo(
        token_contract.address,
        get_token_name(token_contract),
        get_token_symbol(token_contract),
        get_token_decimals(token_contract),
    )
