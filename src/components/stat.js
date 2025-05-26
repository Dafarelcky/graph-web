import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function StatisticsPage() {
  // const { state } = useLocation();
  // const {
  //   raws,
  //   perusahaanMap,
  //   productIngredientMap,
  //   filteredRaws,
  // } = state || {};

  const storedState = localStorage.getItem('statisticsState');
  const { raws, perusahaanMap, productIngredientMap, filteredRaws } = storedState
    ? JSON.parse(storedState)
    : {};

  const { companyStats, rphStats } = useMemo(() => {
    const companyProductMap = {};
    const rphBuyerMap = {};

    for (const [productID, data] of Object.entries(filteredRaws)) {
      const fullData = raws[productID];
      const companyId = fullData?.id_perusahaan;

      if (companyId) {
        if (!companyProductMap[companyId]) companyProductMap[companyId] = [];
        companyProductMap[companyId].push(productID);
      }

      const track = fullData?.track || [];
      for (let i = 0; i < track.length - 1; i++) {
        const buyerName = track[i];
        const rphName = track[i + 1];

        const buyer = Object.values(perusahaanMap).find(p => p.nama_perusahaan === buyerName);
        const rph = Object.values(perusahaanMap).find(p => p.nama_perusahaan === rphName);

        if (buyer && rph?.jenis_usaha === 'rph') {
          if (!rphBuyerMap[rph.nama_perusahaan]) rphBuyerMap[rph.nama_perusahaan] = new Set();
          rphBuyerMap[rph.nama_perusahaan].add(buyer.nama_perusahaan);
        }
      }
    }

    const companyStatsData = Object.entries(companyProductMap).map(([id, productIDs]) => ({
      id,
      name: perusahaanMap[id]?.nama_perusahaan || id,
      count: productIDs.length,
      products: productIDs.map(pid => raws[pid]?.nama_produk || pid),
    }));

    const rphStatsData = Object.entries(rphBuyerMap).map(([rph, buyers]) => ({
      name: rph,
      count: buyers.size,
      buyers: Array.from(buyers),
    }));

    return { companyStats: companyStatsData, rphStats: rphStatsData };
  }, [filteredRaws, perusahaanMap, raws]);

  const chartData = {
    labels: companyStats.map(c => c.name),
    datasets: [
      {
        label: 'Jumlah Produk',
        data: companyStats.map(c => c.count),
        backgroundColor: [
          '#8e44ad', '#9b59b6', '#a29bfe', '#dcd6f7', '#6c5ce7',
          '#b2bec3', '#ffeaa7', '#fab1a0', '#ff7675', '#fd79a8'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{
      fontFamily: 'Poppins, sans-serif',
      backgroundColor: '#f9f6fc',
      padding: '40px',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1 style={{
        color: '#5e2ca5',
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '30px'
      }}>
        📊 Statistik Jejak Produk Halal
      </h1>

      <div style={{ marginBottom: '40px', maxWidth: '500px' }}>
        <Doughnut data={chartData} />
      </div>

      <h2 style={{ color: '#6c3bb5', fontSize: '20px', marginBottom: '10px' }}>📦 Produk per Perusahaan</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#5e2ca5', color: '#fff' }}>
          <tr>
            <th style={{ padding: '12px' }}>Nama Perusahaan</th>
            <th style={{ padding: '12px' }}>Jumlah Produk</th>
            <th style={{ padding: '12px' }}>Daftar Produk</th>
          </tr>
        </thead>
        <tbody>
          {companyStats.map(stat => (
            <tr key={stat.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{stat.name}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>{stat.count}</td>
              <td style={{ padding: '10px' }}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {stat.products.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ color: '#6c3bb5', fontSize: '20px', marginBottom: '10px' }}>🏭 Pelaku Usaha per RPH</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#5e2ca5', color: '#fff' }}>
          <tr>
            <th style={{ padding: '12px' }}>Nama RPH</th>
            <th style={{ padding: '12px' }}>Jumlah Pelaku Usaha</th>
            <th style={{ padding: '12px' }}>Daftar Pelaku Usaha</th>
          </tr>
        </thead>
        <tbody>
          {rphStats.map(stat => (
            <tr key={stat.name} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{stat.name}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>{stat.count}</td>
              <td style={{ padding: '10px' }}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {stat.buyers.map((b, idx) => <li key={idx}>{b}</li>)}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatisticsPage;
