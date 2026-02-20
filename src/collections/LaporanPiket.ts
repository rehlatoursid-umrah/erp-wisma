import type { CollectionConfig } from 'payload'

export const LaporanPiket: CollectionConfig = {
    slug: 'laporan-piket',
    admin: {
        useAsTitle: 'namaPetugas',
        group: 'Operations',
        defaultColumns: ['namaPetugas', 'tanggal', 'jamMasuk', 'jamKeluar', 'createdAt'],
    },
    fields: [
        // ─── Page 1: Info Umum ─────────────────────────
        {
            name: 'email',
            type: 'email',
        },
        {
            name: 'tanggal',
            type: 'date',
            required: true,
        },
        {
            name: 'namaPetugas',
            type: 'select',
            required: true,
            options: [
                'Ubaidillah Chair',
                'Obeid Albar',
                'Habib Arifin Makhtum',
                'Muaz Widad',
                'Indra Juliana Salim',
                'Zulfan Firosi Zulfadhli',
                'Subhan Hadi',
                'Rausan Fiqri',
                'Pengganti Sementara',
            ],
        },
        {
            name: 'jamMasuk',
            type: 'text',
        },
        {
            name: 'jamKeluar',
            type: 'text',
        },
        {
            name: 'lampu',
            type: 'json',
            admin: { description: 'Array of selected lamp options' },
        },
        {
            name: 'laporanKeamanan',
            type: 'textarea',
        },
        {
            name: 'kebersihan',
            type: 'json',
            admin: { description: 'Array of selected cleanliness options' },
        },
        {
            name: 'ruangan',
            type: 'json',
            admin: { description: 'Array of selected rooms' },
        },
        {
            name: 'ruanganLain',
            type: 'text',
        },
        {
            name: 'kegiatanHariIni',
            type: 'textarea',
        },
        {
            name: 'kegiatanEsokHari',
            type: 'textarea',
        },
        {
            name: 'meteranAir',
            type: 'text',
        },
        {
            name: 'meteranListrik',
            type: 'text',
        },

        // ─── Page 2: Hostel ────────────────────────────
        {
            name: 'kamarTerisi',
            type: 'json',
            admin: { description: 'Array of occupied rooms' },
        },
        {
            name: 'snack',
            type: 'json',
            admin: { description: 'Array of snack status' },
        },
        {
            name: 'beresLobby',
            type: 'json',
            admin: { description: 'Array of lobby cleanup tasks' },
        },
        {
            name: 'beresLobbyLain',
            type: 'text',
        },
        {
            name: 'wifiHostel',
            type: 'text',
        },
        {
            name: 'adaPembayaranHostel',
            type: 'text',
        },
        {
            name: 'rincianPembayaranHostel',
            type: 'textarea',
        },

        // ─── Page 3: Auditorium ────────────────────────
        {
            name: 'penyewa1',
            type: 'text',
        },
        {
            name: 'penyewa1Nama',
            type: 'text',
        },
        {
            name: 'rincianBiaya1',
            type: 'text',
        },
        {
            name: 'totalBiaya1',
            type: 'text',
        },
        {
            name: 'penyewa2',
            type: 'text',
        },
        {
            name: 'penyewa2Nama',
            type: 'text',
        },
        {
            name: 'rincianBiaya2',
            type: 'text',
        },
        {
            name: 'totalBiaya2',
            type: 'text',
        },
        {
            name: 'pembayaranLain',
            type: 'json',
            admin: { description: 'Array of other payments' },
        },
        {
            name: 'pembayaranLainCustom',
            type: 'text',
        },
        {
            name: 'rincianBiayaLain',
            type: 'textarea',
        },
    ],
}
