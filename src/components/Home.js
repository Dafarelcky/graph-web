import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProductTable = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // console.log('Token:', token);
    const fetchData = async () => {
      if (token) {
        try {
          const response = await axios.get('https://riset.its.ac.id/teratai-dev/api/v1/produk-master', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('Data fetched successfully:', response.data.result.produkMaster);
          setProducts(response.data.result.produkMaster);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top Bar */}
      <div className="flex justify-end p-4">
        <button className="bg-gray-200 px-4 py-2 rounded-md text-gray-700">
          Admin TokoAio
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4">TABEL PRODUK</h1>

      {/* Search & Filter Section */}
      <div className="bg-gray-200 p-4 rounded-lg flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Cari..."
          className="w-1/2 p-2 rounded-md border border-gray-300"
        />
        <select className="w-1/3 p-2 rounded-md border border-gray-300">
          <option>Filter By: Jenis Produk</option>
          <option>Food</option>
          <option>Drink</option>
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">ID HALAL</th>
              <th className="text-left p-2">NAMA PRODUK</th>
              <th className="text-left p-2">NAMA PERUSAHAAN</th>
              <th className="text-left p-2">JENIS USAHA</th>
              <th className="text-left p-2">TANGGAL DIPERBARUI</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{product.id_halal}</td>
                <td className="p-2">{product.nama_produk}</td>
                <td className="p-2">{product.nama_perusahaan}</td>
                <td className="p-2">{product.jenis_usaha}</td>
                <td className="p-2">{product.diperbarui_pada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
