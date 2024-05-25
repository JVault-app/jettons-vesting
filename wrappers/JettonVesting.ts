import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';
import { OpCodes } from './helpers/constants';

export type JettonVestingConfig = JettonVestingConfigUninited | JettonVestingConfigInited;

export type JettonVestingConfigUninited = {
    type: "uninit";
    factoryAddress: Address;
    index: bigint;
}

export type JettonVestingInitBody = {
    ownerAddress: Address;
    jettonWalletAddress: Address;
    jettonAddressSet: boolean;
    content?: Cell;
    factoryJettonWallet: Address;
    lockedJettons: bigint;  // amount of locked jettons
    jettonsLocked: boolean;  // were jettons locked?
    claimedTimes: number;
    claimedJettons: bigint;
    firstUnlockTime: number;
    firstUnlockSize: number;
    cycleLength: number;
    cyclesNumber: number;
  }
  
  export type JettonVestingConfigInited = {
    type: "inited";
    factoryAddress: Address;
    index: bigint;
    ownerAddress: Address;
    jettonMinterAddress: Address;
    jettonWalletAddress: Address;
    content: Maybe<Cell>;
    factoryJettonWallet: Address;
    lockedJettons: bigint;  // amount of locked jettons
    jettonsLocked: boolean;  // were jettons locked?
    claimedTimes: number;
    claimedJettons: bigint;
    firstUnlockTime: number;
    firstUnlockSize: number;
    cycleLength: number;
    cyclesNumber: number;
  }
  

  export function jettonVestingConfigToCell(config: JettonVestingConfig): Cell {
    let b = beginCell()
        .storeAddress(config.factoryAddress)
        .storeUint(config.index, 128)
    if (config.type === "inited") {
        b = b.storeAddress(config.ownerAddress)
            .storeAddress(config.jettonMinterAddress)
            .storeMaybeRef(config.content)
            .storeRef(
                beginCell()
                    .storeAddress(config.jettonWalletAddress)
                    .storeAddress(config.factoryJettonWallet)
                    .storeCoins(config.lockedJettons)
                    .storeBit(config.jettonsLocked)
                    .storeUint(config.claimedTimes, 16)
                    .storeCoins(config.claimedJettons)
                    .storeUint(config.firstUnlockTime, 32)
                    .storeUint(config.firstUnlockSize, 32)
                    .storeUint(config.cycleLength, 32)
                    .storeUint(config.cyclesNumber, 16)
                .endCell())
    }
    return b.endCell()
}


export class JettonVesting implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonVesting(address);
    }

    static createFromConfig(config: JettonVestingConfig, code: Cell, workchain = 0) {
        const data = jettonVestingConfigToCell(config);
        const init = { code, data };
        return new JettonVesting(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendClaim(provider: ContractProvider, via: Sender, value: bigint, queryId?: Maybe<number | bigint>) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.claim, 32).storeUint(queryId ?? 0, 64).endCell()
        })
    }

    static createBurnLockedJettonsMessage(burnValue: Maybe<bigint>, queryId?: Maybe<number | bigint>) {
        let b = beginCell().storeUint(OpCodes.burnLockedJettons, 32).storeUint(queryId ?? 0, 64)
        return (burnValue ? b.storeCoins(burnValue).endCell() : b.endCell())
    }

    async sendBurnLockedJettons(provider: ContractProvider, via: Sender, value: bigint, burnValue: Maybe<bigint>, queryId?: Maybe<number | bigint>) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonVesting.createBurnLockedJettonsMessage(burnValue, queryId)
        })
    }

    async sendWithdrawJetton(provider: ContractProvider, via: Sender, value: bigint, jettonWallet: Address, jettonAmount: bigint, queryId? : Maybe<number | bigint>) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.withdrawJetton, 32).storeUint(queryId ?? 0, 64).storeAddress(jettonWallet).storeCoins(jettonAmount).endCell()
        })
    }

    async sendProofOwnership(provider: ContractProvider, via: Sender, value: bigint, args: {dest: Address, forwardPayload: Cell, withContent: boolean, queryId?: number | bigint}) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.proveOwnership, 32).storeUint(args.queryId ?? 0, 64).storeAddress(args.dest).storeRef(args.forwardPayload).storeBit(args.withContent).endCell(),
        });
    }

    async sendTakeExcess(provider: ContractProvider, via: Sender, value: bigint, queryId?: Maybe<number | bigint>) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(OpCodes.takeExcess, 32).storeUint(queryId ?? 0, 64).endCell()
        })
    }

    async getData(provider: ContractProvider) {
        let { stack } = await provider.get('get_nft_data', []);
        return {
            init: stack.readBoolean(),
            index: stack.readBigNumber(),
            collection: stack.readAddress(),
            owner: stack.readAddressOpt(),
            content: stack.readCell()
        }
    }

    async getStorage(provider: ContractProvider): Promise<JettonVestingConfig> {
        let { stack } = await provider.get('get_storage_data', []);
        const init = stack.readBoolean();
        if (init) {
            return {
                type: "inited",
                factoryAddress: stack.readAddress(),
                index: stack.readBigNumber(),
                ownerAddress: stack.readAddress(),
                jettonMinterAddress: stack.readAddress(),
                jettonWalletAddress: stack.readAddress(),
                content: stack.readCellOpt(),
                factoryJettonWallet: stack.readAddress(),
                lockedJettons: stack.readBigNumber(),
                jettonsLocked: stack.readBoolean(),
                claimedTimes: stack.readNumber(),
                claimedJettons: stack.readBigNumber(),
                firstUnlockTime: stack.readNumber(),
                firstUnlockSize: stack.readNumber(),
                cycleLength: stack.readNumber(),
                cyclesNumber: stack.readNumber()
              }
        }
        else {
            return {
                type: "uninit",
                factoryAddress: stack.readAddress(),
                index: stack.readBigNumber()
            }
        }
    }
}
