// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RegistriSertifikat} from "../src/RegistriSertifikat.sol";

/// @notice Deploy RegistriSertifikat.
///
/// Mendukung dua cara autentikasi:
///
/// 1. KEYSTORE TERENKRIPSI (dianjurkan) — private key tidak pernah berbentuk
///    teks biasa di disk maupun di riwayat shell:
///
///      cast wallet import penerbit-testnet --interactive
///      forge script script/Deploy.s.sol \
///        --rpc-url $RPC_URL --account penerbit-testnet --broadcast
///
/// 2. VARIABEL LINGKUNGAN (lebih praktis, kurang aman) — hanya untuk dompet
///    sekali pakai berisi dana faucet:
///
///      forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
///
/// Variabel yang dibaca:
///   KUNCI_TX        opsional; bila kosong, dipakai akun dari --account/--private-key
///   ALAMAT_PENERBIT opsional; alamat penandatangan dokumen (bukan rahasia)
contract Deploy is Script {
    function run() external returns (RegistriSertifikat registri) {
        uint256 kunciTx = vm.envOr("KUNCI_TX", uint256(0));

        address pemilik;
        if (kunciTx != 0) {
            pemilik = vm.addr(kunciTx);
            vm.startBroadcast(kunciTx);
        } else {
            // Akun berasal dari --account (keystore) atau --private-key
            pemilik = msg.sender;
            vm.startBroadcast();
        }

        address penerbit = vm.envOr("ALAMAT_PENERBIT", pemilik);
        registri = new RegistriSertifikat(pemilik, penerbit);

        vm.stopBroadcast();

        console.log("RegistriSertifikat :", address(registri));
        console.log("pemilik            :", pemilik);
        console.log("penerbit sah       :", penerbit);
        console.log("chainId            :", block.chainid);
    }
}
