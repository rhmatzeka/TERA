// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RegistriSertifikat} from "../src/RegistriSertifikat.sol";

contract RegistriSertifikatTest is Test {
    RegistriSertifikat internal registri;

    address internal pemilik = address(0xA11CE);
    address internal penerbit = address(0xB0B);
    address internal orangLain = address(0xBAD);

    bytes32 internal constant ID_BATCH = keccak256("batch-uji-1");
    bytes32 internal constant ROOT = bytes32(uint256(0xDEADBEEF));

    event BatchTerbit(
        bytes32 indexed idBatch, bytes32 root, string namaKegiatan, uint256 jumlah, uint256 waktu
    );
    event SertifikatDicabut(bytes32 indexed daun, string alasan, uint256 waktu);
    event PenerbitDiubah(address indexed penerbit, bool sah);

    function setUp() public {
        registri = new RegistriSertifikat(pemilik, penerbit);
    }

    // ------------------------------------------------------------ konstruktor

    function test_KonstruktorMenetapkanPemilikDanPenerbit() public view {
        assertEq(registri.owner(), pemilik);
        assertTrue(registri.penerbitSah(penerbit));
    }

    function test_KonstruktorMenerimaPenerbitKosong() public {
        RegistriSertifikat r = new RegistriSertifikat(pemilik, address(0));
        assertFalse(r.penerbitSah(address(0)));
    }

    // ------------------------------------------------------------- penerbitan

    function test_TerbitkanBatch() public {
        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, ROOT, "Webinar Blockchain", 500);
        assertEq(registri.rootBatch(ID_BATCH), ROOT);
    }

    function test_TerbitkanBatchMemancarkanEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BatchTerbit(ID_BATCH, ROOT, "Webinar Blockchain", 500, block.timestamp);

        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, ROOT, "Webinar Blockchain", 500);
    }

    function test_TolakBatchGanda() public {
        vm.startPrank(pemilik);
        registri.terbitkanBatch(ID_BATCH, ROOT, "Webinar", 500);

        vm.expectRevert(RegistriSertifikat.BatchSudahAda.selector);
        registri.terbitkanBatch(ID_BATCH, ROOT, "Webinar", 500);
        vm.stopPrank();
    }

    function test_TolakRootKosong() public {
        vm.prank(pemilik);
        vm.expectRevert(RegistriSertifikat.RootKosong.selector);
        registri.terbitkanBatch(ID_BATCH, bytes32(0), "Webinar", 500);
    }

    /// K9 — operator (bukan pemilik) tidak dapat menerbitkan sendiri
    function test_TolakPenerbitanOlehBukanPemilik() public {
        vm.prank(orangLain);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, orangLain)
        );
        registri.terbitkanBatch(ID_BATCH, ROOT, "Webinar", 500);
    }

    // ------------------------------------------------------------- pencabutan

    function test_Cabut() public {
        bytes32 daun = keccak256("daun-1");
        vm.prank(pemilik);
        registri.cabut(daun, "plagiarisme");
        assertTrue(registri.dicabut(daun));
    }

    function test_TolakPencabutanGanda() public {
        bytes32 daun = keccak256("daun-1");
        vm.startPrank(pemilik);
        registri.cabut(daun, "plagiarisme");

        vm.expectRevert(RegistriSertifikat.SudahDicabut.selector);
        registri.cabut(daun, "plagiarisme");
        vm.stopPrank();
    }

    function test_TolakAlasanKosong() public {
        vm.prank(pemilik);
        vm.expectRevert(RegistriSertifikat.AlasanKosong.selector);
        registri.cabut(keccak256("daun-1"), "");
    }

    function test_TolakPencabutanOlehBukanPemilik() public {
        vm.prank(orangLain);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, orangLain)
        );
        registri.cabut(keccak256("daun-1"), "alasan");
    }

    function test_CabutBanyakBersifatIdempoten() public {
        bytes32[] memory daunList = new bytes32[](3);
        daunList[0] = keccak256("d1");
        daunList[1] = keccak256("d2");
        daunList[2] = keccak256("d3");

        vm.startPrank(pemilik);
        registri.cabut(daunList[1], "duluan"); // satu sudah dicabut lebih dulu
        registri.cabutBanyak(daunList, "audit ulang"); // tidak boleh revert
        vm.stopPrank();

        assertTrue(registri.dicabut(daunList[0]));
        assertTrue(registri.dicabut(daunList[1]));
        assertTrue(registri.dicabut(daunList[2]));
    }

    // -------------------------------------------------------------- verifikasi

    /// Merkle tree 2 daun yang dibangun manual, agar uji tidak bergantung
    /// pada pustaka luar. Skema hash pasangan mengikuti OpenZeppelin
    /// MerkleProof: pasangan diurutkan sebelum di-hash.
    function _treeDuaDaun(bytes32 a, bytes32 b) internal pure returns (bytes32 root) {
        root = a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function test_VerifikasiBerhasil() public {
        bytes32 daunA = keccak256("dokumen-A");
        bytes32 daunB = keccak256("dokumen-B");
        bytes32 root = _treeDuaDaun(daunA, daunB);

        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, root, "Seminar", 2);

        bytes32[] memory bukti = new bytes32[](1);
        bukti[0] = daunB;

        assertTrue(registri.verifikasi(ID_BATCH, daunA, bukti));
    }

    function test_VerifikasiGagalUntukBuktiSalah() public {
        bytes32 daunA = keccak256("dokumen-A");
        bytes32 daunB = keccak256("dokumen-B");
        bytes32 root = _treeDuaDaun(daunA, daunB);

        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, root, "Seminar", 2);

        bytes32[] memory buktiSalah = new bytes32[](1);
        buktiSalah[0] = keccak256("bukan-saudara");

        assertFalse(registri.verifikasi(ID_BATCH, daunA, buktiSalah));
    }

    function test_VerifikasiGagalUntukBatchTidakAda() public view {
        bytes32[] memory bukti = new bytes32[](0);
        assertFalse(registri.verifikasi(keccak256("tidak-ada"), keccak256("d"), bukti));
    }

    function test_VerifikasiGagalSetelahDicabut() public {
        bytes32 daunA = keccak256("dokumen-A");
        bytes32 daunB = keccak256("dokumen-B");
        bytes32 root = _treeDuaDaun(daunA, daunB);

        vm.startPrank(pemilik);
        registri.terbitkanBatch(ID_BATCH, root, "Seminar", 2);
        registri.cabut(daunA, "plagiarisme");
        vm.stopPrank();

        bytes32[] memory bukti = new bytes32[](1);
        bukti[0] = daunB;

        assertFalse(registri.verifikasi(ID_BATCH, daunA, bukti));
    }

    /// Halaman verifikasi harus dapat membedakan tiga kondisi berbeda
    function test_VerifikasiRinciMembedakanKondisi() public {
        bytes32 daunA = keccak256("dokumen-A");
        bytes32 daunB = keccak256("dokumen-B");
        bytes32 root = _treeDuaDaun(daunA, daunB);

        bytes32[] memory bukti = new bytes32[](1);
        bukti[0] = daunB;

        // batch belum ada
        (bool sah, bool adaBatch, bool sudahCabut) =
            registri.verifikasiRinci(ID_BATCH, daunA, bukti);
        assertFalse(sah);
        assertFalse(adaBatch);
        assertFalse(sudahCabut);

        // batch ada, sertifikat sah
        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, root, "Seminar", 2);
        (sah, adaBatch, sudahCabut) = registri.verifikasiRinci(ID_BATCH, daunA, bukti);
        assertTrue(sah);
        assertTrue(adaBatch);
        assertFalse(sudahCabut);

        // dicabut
        vm.prank(pemilik);
        registri.cabut(daunA, "plagiarisme");
        (sah, adaBatch, sudahCabut) = registri.verifikasiRinci(ID_BATCH, daunA, bukti);
        assertFalse(sah);
        assertTrue(adaBatch);
        assertTrue(sudahCabut);
    }

    // --------------------------------------------------------- kelola penerbit

    function test_RotasiPenerbit() public {
        address penerbitBaru = address(0xC0FFEE);

        vm.startPrank(pemilik);
        registri.aturPenerbit(penerbitBaru, true);
        registri.aturPenerbit(penerbit, false);
        vm.stopPrank();

        assertTrue(registri.penerbitSah(penerbitBaru));
        assertFalse(registri.penerbitSah(penerbit));
    }

    function test_TolakAturPenerbitOlehBukanPemilik() public {
        vm.prank(orangLain);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, orangLain)
        );
        registri.aturPenerbit(orangLain, true);
    }

    // ------------------------------------------------------------------- fuzz

    function testFuzz_BatchApaPunTersimpan(bytes32 idBatch, bytes32 root) public {
        vm.assume(root != bytes32(0));

        vm.prank(pemilik);
        registri.terbitkanBatch(idBatch, root, "Kegiatan", 1);
        assertEq(registri.rootBatch(idBatch), root);
    }

    function testFuzz_BuktiAcakTidakPernahLolos(bytes32 daunAcak, bytes32 buktiAcak) public {
        bytes32 daunA = keccak256("dokumen-A");
        bytes32 daunB = keccak256("dokumen-B");
        bytes32 root = _treeDuaDaun(daunA, daunB);
        vm.assume(daunAcak != daunA && daunAcak != daunB);

        vm.prank(pemilik);
        registri.terbitkanBatch(ID_BATCH, root, "Seminar", 2);

        bytes32[] memory bukti = new bytes32[](1);
        bukti[0] = buktiAcak;

        assertFalse(registri.verifikasi(ID_BATCH, daunAcak, bukti));
    }
}
