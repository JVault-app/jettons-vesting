import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQADYRiavRRe-eh4D-VjIJp15MPxMi5rGIWzk4ClX1zBvYI5")))
    await factory.sendChangeCreationFee(provider.sender(), toNano("0.5"))
}
