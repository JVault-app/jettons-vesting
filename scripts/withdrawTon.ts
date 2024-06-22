import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("kQAFpxXEHwPpjzIdxSEoFtfkkx1w9O8Yzr7SApq2vd6HCbsv")))
    await factory.sendWithdrawTon(provider.sender())
}
