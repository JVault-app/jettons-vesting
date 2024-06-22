import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQD1b2tHSkG9TNf5SrO1tmgfYV8Tl6ZoEpON57xe4f-sQNQo")))
    await factory.sendChangeCreationFee(provider.sender(), toNano("0.5"))
}
