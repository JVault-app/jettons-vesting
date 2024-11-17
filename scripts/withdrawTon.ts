import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQCSFRiFm_qjv7W6S9xjI7ZY2XJecUhd4VymLglsOE88lMYH")))
    await factory.sendWithdrawTon(provider.sender())
}
