// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RegistriNaif — HANYA UNTUK PEMBANDING, BUKAN KODE PRODUKSI
/// @notice Menyimpan setiap sertifikat secara individual di storage, yaitu
///         pendekatan yang lazim dipakai skripsi sejenis. Dipakai sebagai
///         pembanding terhadap RegistriSertifikat pada Bab 4.
/// @dev    Biaya tumbuh linear terhadap jumlah sertifikat.
contract RegistriNaif is Ownable {
    mapping(bytes32 => bool) public sertifikat;

    event SertifikatTerbit(bytes32 indexed hashSertifikat, uint256 waktu);

    constructor(address pemilik) Ownable(pemilik) {}

    /// @notice Menerbitkan SATU sertifikat = satu penulisan storage
    function terbitkanSatu(bytes32 hashSertifikat) external onlyOwner {
        sertifikat[hashSertifikat] = true;
        emit SertifikatTerbit(hashSertifikat, block.timestamp);
    }

    /// @notice Varian "batch" naif: tetap satu penulisan storage per sertifikat,
    ///         hanya biaya dasar transaksi (21.000 gas) yang dihemat.
    function terbitkanBanyak(bytes32[] calldata daftar) external onlyOwner {
        uint256 n = daftar.length;
        for (uint256 i = 0; i < n; ++i) {
            sertifikat[daftar[i]] = true;
            emit SertifikatTerbit(daftar[i], block.timestamp);
        }
    }
}
