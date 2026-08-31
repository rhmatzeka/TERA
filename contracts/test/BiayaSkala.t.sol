// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RegistriSertifikat} from "../src/RegistriSertifikat.sol";
import {RegistriNaif} from "./pembanding/RegistriNaif.sol";

/// @notice Pengukuran untuk Bab 4: membuktikan biaya penerbitan tidak
///         bergantung pada jumlah sertifikat dalam batch (K1 & K2 pada plan.md).
contract BiayaSkalaTest is Test {
    RegistriSertifikat internal registri;
    RegistriNaif internal naif;
    address internal pemilik = address(0xA11CE);

    function setUp() public {
        registri = new RegistriSertifikat(pemilik, address(0xB0B));
        naif = new RegistriNaif(pemilik);
    }

    // ------------------------------------------------------------------ K1/K2

    /// @notice Gas penerbitan batch untuk berbagai ukuran N.
    ///         Root selalu 32 byte, berapa pun N — inilah inti desainnya.
    /// @dev    PENTING soal metodologi: panggilan pertama ke sebuah kontrak
    ///         membayar biaya akses "cold" (EIP-2929) — akun kontrak 2.600 gas
    ///         dan slot `owner` 2.100 gas. Tanpa pemanasan, pengukuran pertama
    ///         tampak ~6.500 gas lebih mahal dan seolah-olah gas bergantung
    ///         pada N. Itu artefak pengukuran, bukan sifat kontrak.
    ///         Karena itu dilakukan satu panggilan pemanasan sebelum mengukur.
    ///         Catat hal ini di bab metodologi.
    function test_GasBatchKonstanTerhadapJumlah() public {
        // pemanasan: menghangatkan akun kontrak dan slot `owner`
        vm.prank(pemilik);
        registri.terbitkanBatch(keccak256("pemanasan"), keccak256("r"), "pemanasan", 1);

        uint256[6] memory ukuran = [uint256(10), 100, 1_000, 10_000, 100_000, 1_000_000];
        uint256[6] memory hasil;

        console.log("");
        console.log("=== K1/K2: Gas terbitkanBatch vs jumlah sertifikat ===");
        console.log("        N | gas");

        for (uint256 i = 0; i < ukuran.length; ++i) {
            uint256 n = ukuran[i];
            bytes32 idBatch = keccak256(abi.encode("batch", n));
            bytes32 root = keccak256(abi.encode("root", n));

            vm.prank(pemilik);
            uint256 sebelum = gasleft();
            registri.terbitkanBatch(idBatch, root, "Webinar Blockchain 2026", n);
            hasil[i] = sebelum - gasleft();

            console.log(n, hasil[i]);
        }

        uint256 min = hasil[0];
        uint256 max = hasil[0];
        for (uint256 i = 1; i < hasil.length; ++i) {
            if (hasil[i] < min) min = hasil[i];
            if (hasil[i] > max) max = hasil[i];
        }
        uint256 simpanganBps = ((max - min) * 10_000) / min;

        console.log("selisih absolut (gas):", max - min);
        console.log("simpangan (basis poin, 100 bps = 1%):", simpanganBps);

        // K2: simpangan < 5%. Selisih yang tersisa murni berasal dari jumlah
        // byte bukan-nol pada calldata `jumlah` (16 gas per byte).
        assertLt(simpanganBps, 500, "K2 gagal: simpangan gas melebihi 5%");
    }

    /// @notice Ringkasan perbandingan untuk tabel utama Bab 4.
    function test_RingkasanPerbandinganBab4() public {
        // pemanasan kedua kontrak
        vm.startPrank(pemilik);
        registri.terbitkanBatch(keccak256("warm"), keccak256("r"), "w", 1);
        naif.terbitkanSatu(keccak256("warm"));
        vm.stopPrank();

        // Merkle batch — berapa pun N
        vm.prank(pemilik);
        uint256 sebelum = gasleft();
        registri.terbitkanBatch(keccak256("bench"), keccak256("root"), "Webinar", 100_000);
        uint256 gasMerkle = sebelum - gasleft();

        // Naif — satu sertifikat
        vm.prank(pemilik);
        sebelum = gasleft();
        naif.terbitkanSatu(keccak256("bench-naif"));
        uint256 gasNaifSatu = sebelum - gasleft();

        uint256 n = 100_000;
        uint256 totalNaifTerpisah = (gasNaifSatu + 21_000) * n; // tiap sertifikat 1 transaksi
        uint256 totalNaifBatch = gasNaifSatu * n + 21_000; // dikumpulkan dalam transaksi besar
        uint256 totalMerkle = gasMerkle;

        console.log("");
        console.log("=== RINGKASAN untuk Bab 4 (N = 100.000 sertifikat) ===");
        console.log("Naif, 1 transaksi per sertifikat (gas) :", totalNaifTerpisah);
        console.log("Naif, dikumpulkan dalam batch    (gas) :", totalNaifBatch);
        console.log("Merkle batch, 1 transaksi        (gas) :", totalMerkle);
        console.log("Faktor penghematan vs naif terpisah    :", totalNaifTerpisah / totalMerkle);
        console.log("Faktor penghematan vs naif batch       :", totalNaifBatch / totalMerkle);
        console.log("");
        console.log("Catatan: batas gas per blok pada umumnya 30.000.000, sehingga");
        console.log("pendekatan naif untuk N=100.000 TIDAK MUAT dalam satu blok dan");
        console.log("harus dipecah menjadi ratusan transaksi.");

        assertGt(totalNaifTerpisah / totalMerkle, 1000, "penghematan seharusnya ordo ribuan kali");
    }

    // ------------------------------------------------------- perbandingan naif

    /// @notice Biaya pendekatan naif per sertifikat (satu penulisan storage).
    function test_GasNaifPerSertifikat() public {
        vm.prank(pemilik);
        uint256 sebelum = gasleft();
        naif.terbitkanSatu(keccak256("sertifikat-1"));
        uint256 gasSatu = sebelum - gasleft();

        console.log("");
        console.log("=== Pembanding: pendekatan naif ===");
        console.log("gas per sertifikat (transaksi terpisah):", gasSatu + 21_000);
        console.log("gas per sertifikat (dalam batch naif) :", gasSatu);
    }

    /// @notice Pendekatan naif dengan batch 100 sertifikat — tetap linear.
    function test_GasNaifTumbuhLinear() public {
        uint256[3] memory ukuran = [uint256(10), 50, 100];

        console.log("");
        console.log("=== Pendekatan naif: gas vs jumlah (linear) ===");
        console.log("        N |   gas");

        for (uint256 u = 0; u < ukuran.length; ++u) {
            uint256 n = ukuran[u];
            bytes32[] memory daftar = new bytes32[](n);
            for (uint256 i = 0; i < n; ++i) {
                daftar[i] = keccak256(abi.encode("naif", n, i));
            }

            vm.prank(pemilik);
            uint256 sebelum = gasleft();
            naif.terbitkanBanyak(daftar);
            uint256 dipakai = sebelum - gasleft();

            console.log(n, dipakai);
        }
    }

    // ----------------------------------------------------------- pencabutan

    function test_GasPencabutan() public {
        vm.prank(pemilik);
        uint256 sebelum = gasleft();
        registri.cabut(keccak256("daun-1"), "plagiarisme");
        uint256 gasSatu = sebelum - gasleft();

        bytes32[] memory daunList = new bytes32[](50);
        for (uint256 i = 0; i < 50; ++i) {
            daunList[i] = keccak256(abi.encode("cabut", i));
        }

        vm.prank(pemilik);
        sebelum = gasleft();
        registri.cabutBanyak(daunList, "audit ulang");
        uint256 gasMassal = sebelum - gasleft();

        console.log("");
        console.log("=== Pencabutan ===");
        console.log("cabut 1 sertifikat        :", gasSatu);
        console.log("cabutBanyak 50 sertifikat :", gasMassal);
        console.log("rata-rata per sertifikat  :", gasMassal / 50);
    }

    // ------------------------------------------------------------ verifikasi

    /// @notice Verifikasi bersifat `view` — tidak memakan gas saat dipanggil
    ///         dari luar rantai. Diukur untuk kelengkapan saja.
    function test_GasVerifikasiBerdasarKedalamanBukti() public {
        bytes32 root = keccak256("root");
        vm.prank(pemilik);
        registri.terbitkanBatch(keccak256("b"), root, "Seminar", 1000);

        console.log("");
        console.log("=== Verifikasi (view, gratis dari luar rantai) ===");
        console.log("kedalaman | gas");

        uint256[4] memory kedalaman = [uint256(4), 10, 17, 20];
        for (uint256 k = 0; k < kedalaman.length; ++k) {
            bytes32[] memory bukti = new bytes32[](kedalaman[k]);
            for (uint256 i = 0; i < kedalaman[k]; ++i) {
                bukti[i] = keccak256(abi.encode(i));
            }
            uint256 sebelum = gasleft();
            registri.verifikasi(keccak256("b"), keccak256("daun"), bukti);
            console.log(kedalaman[k], sebelum - gasleft());
        }
    }
}
