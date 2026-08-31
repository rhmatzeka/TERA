// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RegistriSertifikat} from "../src/RegistriSertifikat.sol";

/// @notice Uji kompatibilitas lintas bahasa.
///
/// Ini uji terpenting di seluruh proyek. Merkle tree dibangun di TypeScript
/// dengan pustaka merkle-tree OpenZeppelin, lalu buktinya diverifikasi di Solidity
/// dengan MerkleProof milik OpenZeppelin. Kalau skema hash daun kedua sisi
/// tidak identik (lihat plan.md 15.2), uji ini gagal — dan kegagalan itu
/// akan muncul di sini, bukan saat sistem sudah berjalan.
///
/// Vektor dihasilkan oleh: apps/web/test/merkle.test.ts
/// Regenerasi dengan: cd apps/web && bun test
contract MerkleKompatibilitasTest is Test {
    RegistriSertifikat internal registri;
    address internal pemilik = address(0xA11CE);

    // --- vektor dari TypeScript, batch 4 peserta -------------------------
    bytes32 internal constant ROOT_JS =
        0x63af8fe5a4d41b9f7c2aaab9bbf15d961f77e237d4a96ef3694932d4d44fbf99;
    bytes32 internal constant DAUN_JS =
        0x85fbe78016e45f6f2253c58b34b2c5f022fcdbe1f16c366ec4b87b170879a740;
    bytes32 internal constant BUKTI_0 =
        0xf92f17ca5d51dc5280f1c4fd1d733d6aee30677e96e600d5d5d347d59f93057e;
    bytes32 internal constant BUKTI_1 =
        0xd4acbee13f270d2faba4d59c3a7a4461ec96e02f0ab3438f0b54bbdebba65218;

    bytes32 internal constant ID_BATCH = keccak256("batch-kompatibilitas");

    function setUp() public {
        registri = new RegistriSertifikat(pemilik, address(0xB0B));
        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, ROOT_JS, "Webinar Blockchain 2026", 4);
    }

    function _buktiJs() internal pure returns (bytes32[] memory bukti) {
        bukti = new bytes32[](2);
        bukti[0] = BUKTI_0;
        bukti[1] = BUKTI_1;
    }

    /// Bukti yang dihasilkan TypeScript HARUS diterima Solidity.
    function test_BuktiDariTypeScriptDiterimaSolidity() public view {
        assertTrue(
            registri.verifikasi(ID_BATCH, DAUN_JS, _buktiJs()),
            "skema hash daun JS dan Solidity tidak cocok"
        );
    }

    function test_VerifikasiRinciKonsistenDenganVektorJs() public view {
        (bool sah, bool adaBatch, bool sudahCabut) =
            registri.verifikasiRinci(ID_BATCH, DAUN_JS, _buktiJs());
        assertTrue(sah);
        assertTrue(adaBatch);
        assertFalse(sudahCabut);
    }

    function test_DaunDiubahDitolak() public view {
        bytes32 daunPalsu = bytes32(uint256(DAUN_JS) ^ 1); // ubah satu bit
        assertFalse(registri.verifikasi(ID_BATCH, daunPalsu, _buktiJs()));
    }

    function test_BuktiDiubahDitolak() public view {
        bytes32[] memory bukti = _buktiJs();
        bukti[0] = bytes32(uint256(BUKTI_0) ^ 1);
        assertFalse(registri.verifikasi(ID_BATCH, DAUN_JS, bukti));
    }

    function test_UrutanBuktiDibalikDitolak() public view {
        bytes32[] memory bukti = new bytes32[](2);
        bukti[0] = BUKTI_1;
        bukti[1] = BUKTI_0;
        assertFalse(registri.verifikasi(ID_BATCH, DAUN_JS, bukti));
    }

    function test_PencabutanMembatalkanBuktiYangValid() public {
        assertTrue(registri.verifikasi(ID_BATCH, DAUN_JS, _buktiJs()));

        vm.prank(pemilik);
        registri.cabut(DAUN_JS, "sertifikat ditarik");

        assertFalse(registri.verifikasi(ID_BATCH, DAUN_JS, _buktiJs()));
    }
}
