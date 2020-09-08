export const contract =
` 
namespace FungibleToken =
  record state = {
    owner            : address, 
    total_supply      : int,
    map_balances         : map(address, int),
    map_allowed          : map((address,address), int)}

  stateful entrypoint init() = {
    owner = Call.caller,
    total_supply = 0,
    map_balances = {},
    map_allowed = {}}

  function total_supply() : int =
    state.total_supply

  function balance_of(who: address) : int =
    Map.lookup_default(who, state.map_balances, 0)

  stateful function transfer(to: address, value: int) =
    transfer'(Call.caller, to, value)

  stateful function transfer'(from: address, to: address, value: int) =
    require(value > 0, "Value is sub zero")
    require(value =< balance_of(from), "Not enough balance")
    require(to != #0, "Invalid address")

    put(state{
      map_balances[from] = balance_of(from) - value,
      map_balances[to] = balance_of(to) + value })

  function get(addr: address) : int =
    Map.lookup_default((addr, Call.caller), state.map_allowed, 0)

  stateful function mint(account: address, value: int) =
    only_owner()
    require(account != #0, "Invalid address")

    put(state{total_supply = state.total_supply + value,
          map_balances[account] = balance_of(account) + value})

  stateful function burn(value: int) =
    require(balance_of(Call.caller) >= value, "Burned amount is less than account balance")

    put(state{total_supply = state.total_supply - value,
          map_balances[Call.caller] = balance_of(Call.caller) - value})

  private function require(expression : bool, error : string) =
    if(!expression) 
      abort(error)

  private function only_owner() =
      require(Call.caller == state.owner, "Only owner can mint!")

contract LoanContract =
  record state = {
    collateral: FungibleToken,
    stablecoin: FungibleToken,
    collateral_rate: int,
    index : int,
    map_loan: map(int, loan)
  } 

  record loan = { 
    borrower: address,
    lender: address,
    duration: int,
    amount: int
    }

  stateful entrypoint init(collateral_addr: FungibleToken, stablecoin_addr: FungibleToken) =
    {
        collateral = collateral_addr,
        stablecoin = stablecoin_addr,
        collateral_rate = 2,
        index = 1,
        map_loan = {}
    }

  stateful entrypoint create_loan(amount: int, duration: int) : () =
    let new_loan: loan = {
        borrower = Call.caller
        duration = duration
        amount = amount
    }
    let collateral_amount: int = amount * state.collateral_rate
    collateral.transfer(Contract.address, collateral_amount)
    put(state{map_loan[state.index] = new_loan})
    put(state{index = (state.index + 1)})

  stateful entrypoint accept_loan(index: int) : () =
    let i_loan: loan = state.map_loan[index]
    let up_loan: loan = {
        borrower = i_loan.borrower
        lender = Call.caller
        duration = i_loan.duration
        amount = i_loan.amount
    }
    stablecoin.transfer(up_loan.borrower, up_loan.amount)
    put(state{map_loan[index] = up_loan})

  stateful entrypoint pay_loan(index: int) : () =
    let i_loan: loan = state.map_loan[index]
    let up_loan: loan = {
        borrower = i_loan.borrower
        lender = i_loan.lender
        duration = -1
        amount = i_loan.amount
    }
    let collateral_amount: int = up_loan.amount * state.collateral_rate
    stablecoin.transfer(i_loan.lender, i_loan.amount)
    collateral.transfer(i_loan.lender, collateral_amount)`