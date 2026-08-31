// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title RegistriSertifikat
/// @notice Jangkar bukti untuk batch sertifikat digital.
///         Satu batch berisi N sertifikat diringkas menjadi satu Merkle root,
///         sehingga biaya penerbitan tidak bergantung pada N.
/// @dev    Prinsip optimasi gas: hanya data yang perlu DIBACA kontrak yang
///         masuk storage. Sisanya dikirim lewat event (~10x lebih murah).
///         Tidak ada data pribadi yang disimpan di kontrak ini.
contract RegistriSertifikat is Ownable {
    // ---------------------------------------------------------------- storage

    /// @notice idBatch => Merkle root. Satu-satunya storage per penerbitan.
    mapping(bytes32 => bytes32) public rootBatch;

    /// @notice daun => status pencabutan.
    mapping(bytes32 => bool) public dicabut;

    /// @notice Alamat yang berwenang menandatangani dokumen kredensial.
    ///         Berupa daftar (bukan alamat tunggal) agar kunci dapat dirotasi
    ///         tanpa membatalkan sertifikat yang sudah terbit.
    mapping(address => bool) public penerbitSah;

    // ----------------------------------------------------------------- events

    event BatchTerbit(
        bytes32 indexed idBatch,
        bytes32 root,
        string namaKegiatan,
        uint256 jumlah,
        uint256 waktu
    );

    event SertifikatDicabut(bytes32 indexed daun, string alasan, uint256 waktu);

    event PenerbitDiubah(address indexed penerbit, bool sah);

    // ----------------------------------------------------------------- errors

    error BatchSudahAda();
    error BatchTidakDitemukan();
    error RootKosong();
    error SudahDicabut();
    error AlasanKosong();

    // ------------------------------------------------------------ constructor

    constructor(address pemilik, address penerbitAwal) Ownable(pemilik) {
        if (penerbitAwal != address(0)) {
            penerbitSah[penerbitAwal] = true;
            emit PenerbitDiubah(penerbitAwal, true);
        }
    }

    // ------------------------------------------------------------ penerbitan

    /// @notice Menerbitkan satu batch. Biaya identik untuk 10 maupun 100.000
    ///         sertifikat karena hanya `root` yang masuk storage.
    /// @param idBatch      keccak256(UUID batch) — lihat plan.md 15.4
    /// @param root         Merkle root dari seluruh daun batch
    /// @param namaKegiatan Hanya masuk event, tidak masuk storage
    /// @param jumlah       Hanya masuk event, untuk keperluan audit
    function terbitkanBatch(
        bytes32 idBatch,
        bytes32 root,
        string calldata namaKegiatan,
        uint256 jumlah
    ) external onlyOwner {
        if (rootBatch[idBatch] != bytes32(0)) revert BatchSudahAda();
        if (root == bytes32(0)) revert RootKosong();

        rootBatch[idBatch] = root;

        emit BatchTerbit(idBatch, root, namaKegiatan, jumlah, block.timestamp);
    }

    // ------------------------------------------------------------ pencabutan

    /// @notice Mencabut satu sertifikat berdasarkan daun Merkle-nya.
    /// @dev    Daun tidak mengandung data pribadi — hanya hash dokumen.
    function cabut(bytes32 daun, string calldata alasan) external onlyOwner {
        if (dicabut[daun]) revert SudahDicabut();
        if (bytes(alasan).length == 0) revert AlasanKosong();

        dicabut[daun] = true;

        emit SertifikatDicabut(daun, alasan, block.timestamp);
    }

    /// @notice Pencabutan massal — hemat gas dibanding memanggil `cabut` berulang
    ///         karena biaya dasar transaksi (21.000 gas) hanya dibayar sekali.
    function cabutBanyak(bytes32[] calldata daunList, string calldata alasan) external onlyOwner {
        if (bytes(alasan).length == 0) revert AlasanKosong();

        uint256 n = daunList.length;
        for (uint256 i = 0; i < n; ++i) {
            bytes32 daun = daunList[i];
            if (dicabut[daun]) continue; // idempoten: lewati yang sudah dicabut
            dicabut[daun] = true;
            emit SertifikatDicabut(daun, alasan, block.timestamp);
        }
    }

    // ------------------------------------------------------------- verifikasi

    /// @notice Verifikasi keanggotaan sertifikat dalam batch.
    /// @dev    `daun` WAJIB dihitung dengan skema hash ganda OpenZeppelin
    ///         StandardMerkleTree — lihat plan.md 15.2.
    function verifikasi(bytes32 idBatch, bytes32 daun, bytes32[] calldata bukti)
        external
        view
        returns (bool)
    {
        if (dicabut[daun]) return false;

        bytes32 root = rootBatch[idBatch];
        if (root == bytes32(0)) return false;

        return MerkleProof.verify(bukti, root, daun);
    }

    /// @notice Versi rinci — membedakan "tidak ditemukan" dari "dicabut",
    ///         sehingga halaman verifikasi dapat menampilkan alasan yang tepat.
    /// @return sah        true bila terbukti anggota batch DAN belum dicabut
    /// @return adaBatch   false bila batch belum pernah diterbitkan
    /// @return sudahCabut true bila sertifikat telah dicabut
    function verifikasiRinci(bytes32 idBatch, bytes32 daun, bytes32[] calldata bukti)
        external
        view
        returns (bool sah, bool adaBatch, bool sudahCabut)
    {
        bytes32 root = rootBatch[idBatch];
        adaBatch = root != bytes32(0);
        sudahCabut = dicabut[daun];

        if (!adaBatch) return (false, false, sudahCabut);

        bool anggota = MerkleProof.verify(bukti, root, daun);
        sah = anggota && !sudahCabut;
    }

    // --------------------------------------------------------- kelola penerbit

    /// @notice Menambah atau mencabut kewenangan penandatangan dokumen.
    /// @dev    Rotasi kunci tidak membatalkan sertifikat lama: verifier
    ///         memeriksa apakah alamat penanda tangan PERNAH sah, dan riwayat
    ///         perubahannya terekam permanen lewat event.
    function aturPenerbit(address penerbit, bool sah) external onlyOwner {
        penerbitSah[penerbit] = sah;
        emit PenerbitDiubah(penerbit, sah);
    }
}
