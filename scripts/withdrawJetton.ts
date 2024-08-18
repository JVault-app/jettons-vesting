import { Address, beginCell, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Factory } from '../wrappers/Factory';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(Factory.createFromAddress(Address.parse("EQBK8uTlStT0O2MeeTx-aKm1ye8xrtjimk356TxbDA5L37jz")))
    const jettonWalletAddress = Address.parse("EQAwGPBvwf_pqFGhqr7CJOV5k_7ROaK_-4kHlmEAwc-lAtPw")
    const jettonAmount = toNano(1);
    const recipientAddress = Address.parse("UQCovSj8c8Ik1I-RZt7dbIOEulYe-MfJ2SN5eMhxwfACvp7x")
    const forwardPayload = beginCell().storeUint(0, 32).storeStringTail("Test").endCell() 
    await factory.sendWithdrawJetton(provider.sender(), jettonWalletAddress, jettonAmount, recipientAddress, forwardPayload);
}
