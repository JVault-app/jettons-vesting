import { Address } from "@ton/core";

export const OpCodes = {
    // Common
    getStorageData: 0x5b88e5cc,
    reportStorageData: 0xaab4a8ef,
    excesses: 0xd53276db,
    withdrawTon: 0x37726bdb,
    withdrawJetton: 0x11c09682,
  
    // Jettons
    transferJetton: 0xf8a7ea5,
    transferNotification: 0x7362d09c,
    provideWalletAddress: 0x2c76b973,
    takeWalletAddress: 0xd1735400,
    burnJetton: 0x595f07bc,
  
    // Factory
    createLock: 0x62e0667,
    changeCreationFee: 0x610240f1,
    changeSbtCode: 0xb97d7c00,
    updateVestingCode: 0xdf4f17cb,
    changeFactoryCode: 0xe2d2d211,
    changeContent: 0xec29200,
  
    // SBT
    initialize: 0xd80dee82,
    transfer: 0x5fcc3d14,
    requestOwner: 0xd0c3bfea,
    ownerInfo: 0x0dd607e3,
    proveOwnership: 0x04ded148,
    ownershipProof: 0x0524c7ae,
    ownershipProofBounced: 0xc18e86d2,
    destroy: 0x1f04537a,
    revoke: 0x6f89f5e3,
    takeExcess: 0xd136d3b3,
    excessesSbt: 0xd53276db,  // Renamed to avoid conflict with common excesses
    getStaticData: 0x2fcb26a2,
    reportStaticData: 0x8b771735,
    getRoyaltyParams: 0x693d3950,
    reportRoyaltyParams: 0xa8cb00ad,
    claim: 0xa769de27,
    burnLockedJettons: 0x6c24f413,
    confirmInitialization: 0xe9bfea7f  // Corrected spelling from confitm to confirm
  };
  
  export const ErrorCodes = {
    outOfGas: 13,
    incorrectJetton: 43,
    notUnlockedYet: 44,
    notEnoughJettons: 45,
    alreadyUnlocked: 47,
    incorrectSender: 49,
    nothingToClaim: 50,
    intOutOfRange: 51,
    nftBurned: 52,
    alreadyInited: 57,
    notInited: 60,
    notEnoughTon: 61,
    addressNotSet: 62,
    wrongChain: 333,
    unsupportedOp: 0xffff
  };
  
  export const Gas = {
    minTonsForStorage: 25000000,
    createVesting: 125000000,
    completeLock: 10000000,
    sendJettons: 40000000,
    burnJettons: 30000000,
    claimJettons: 42000000,
    provideAddr: 10000000
  };
  
  export const MessageModes = {
    simple: 0,
    carryRemainingGas: 64,
    carryRemainingBalance: 128,
    payFeesSeparately: 1,
    ignoreErrors: 2,
    bounceOnFail: 16,
    selfdestructOnEmpty: 32
  };
  
  export const OtherConstants = {
    percentDivider: 100000000n,
    burnAddress: Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"),
    uint256Max: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
    oneDay: 24 * 60 * 60
  };
  