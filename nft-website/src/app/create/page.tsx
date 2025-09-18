"use client";
import { contractAddress } from "@/constants";
import { getContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { ConnectButton, TransactionButton } from "thirdweb/react";
import client from "../client";

import { toast } from "sonner";

export default function Component() {
  const contract = getContract({
    client: client,
    address: contractAddress,
    chain: sepolia,
  });

  return (
    <>
      <ConnectButton client={client}></ConnectButton>
      <TransactionButton
        onTransactionConfirmed={() => toast.success("Created SuccessFully")}
        onError={() => toast.error("Failed To create")}
        transaction={() =>
          prepareContractCall({
            contract,
            method: "function mintNFT(string _hash, uint256 royaltyPercent)",
            params: ["22335hjehuoewfhuewwey232553", BigInt(22)], // ✅ safer
          })
        }
      >
        Create
      </TransactionButton>
    </>
  ); // ✅ fixed casing
}
