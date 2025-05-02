import React, { useEffect, useState, useRef, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Graph() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [raws, setRaws] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedPembina, setSelectedPembina] = useState('');
  const [productIngredientMap, setProductIngredientMap] = useState({});
  const [perusahaan, setPerusahaan] = useState([]);
  const [cyInstance, setCyInstance] = useState(null);
  const [graphKey, setGraphKey] = useState(0);
  const [perusahaanMap, setPerusahaanMap] = useState({});

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
          // console.log('Data fetched successfully:', response.data.result.produkMaster);
          setProducts(response.data.result.produkMaster);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        try {
          const response = await axios.get('https://riset.its.ac.id/teratai-dev/api/v1/perusahaan', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          const allCompanies = response.data.result.perusahaan;
  
          // ✅ Filter and map pembina companies
          const pembinaCompanies = allCompanies
            .filter(company => company.jenis_usaha?.toLowerCase() === 'pembina')
            .map(company => ({
              _id: company._id,
              nama_perusahaan: company.nama_perusahaan,
              jenis_usaha: company.jenis_usaha,
            }));
  
          console.log("📦 Pembina Companies:", pembinaCompanies);
  
          // Optional: store in state
          setPerusahaan(pembinaCompanies); // or use a new state like setPembinaPerusahaan if needed

          const companyMap = {};
          allCompanies.forEach(c => {
            companyMap[c.nama_perusahaan] = c;
          });
          setPerusahaanMap(companyMap);
  
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }
    };
  
    fetchData();
  }, [token]);
  

  useEffect(() => {
    const fetchProductDetail = async () => {
      const username = 'ITStEr4Ta1!';
      const password = 'bzhbf8q5fbkqb-bjhefb90yfebjh-7hjebfq3745i';
      const resultDict = {};
      const product_ingredient = {};
  
      for (const product of products) {
        try {
          const res = await axios.get(
            `https://riset.its.ac.id/teratai-dev/api/v1/traceability/${product.id_halal}`,
            { auth: { username, password } }
          );
  
          const data = res.data.result;
          const extracted = [];
  
          // Loop through each key in the result object
          for (const key in data) {
            const item = data[key];
            if (item?.nama_perusahaan) {
              extracted.push(item.nama_perusahaan);
            } else if (item?.juru_sembelih) {
              extracted.push(item.juru_sembelih);
            }
          }
  
          // Store the array in the dictionary using id_halal as the key
          const dataArray = Object.values(data);

          if (dataArray[0]?.bahan?.[0]?.nama_bahan) {
            product_ingredient[product.nama_produk] = dataArray[0].bahan[0].nama_bahan;
          }
          resultDict[product.nama_produk] = {
            track: extracted,
            id_pembina: product.id_pembina,
            jenis_perusahaan: product.jenis_perusahaan,
            provinsi: product.provinsi,
            kota: product.kota,
            diperbarui_pada: product.diperbarui_pada
          };


          
          // console.log(data)
  
        } catch (error) {
          console.error(`❌ Error fetching for ${product.nama_produk}:`, error.response?.status || error.message);
        }
      }
      setProductIngredientMap(product_ingredient);
      setRaws(resultDict);
    };
  
    if (products.length > 0) {
      fetchProductDetail();
    }
  }, [products]);

  const generateElements = (data) => {
    const elements = [];
    const addedNodes = new Set();
  
    for (const productName in data) {
      const chain = data[productName];
  
      if (!chain || chain.length === 0) continue;
  
      const source = chain[0]; // "Tera Abadi"
      const rest = chain.slice(1);
  
      // Add node: "Tera Abadi"
      if (!addedNodes.has(source)) {
        elements.push({ data: { id: source, label: source }, classes: 'entity' });
        addedNodes.add(source);
      }
  
      // Add product node
      if (!addedNodes.has(productName)) {
        elements.push({ data: { id: productName, label: productName }, classes: 'product' });
        addedNodes.add(productName);
      }
  
      // Edge: Tera Abadi → Product
      elements.push({
        data: {
          id: `${source}_${productName}`,
          source: source,
          target: productName,
        },
      });
  
      // Continue the chain: product → next → next → ...
      let prev = productName;
      for (const current of rest) {
        if (!addedNodes.has(current)) {
          elements.push({ data: { id: current, label: current }, classes: 'entity' });
          addedNodes.add(current);
        }
  
        elements.push({
          data: {
            id: `${prev}_${current}`,
            source: prev,
            target: current,
          },
        });
  
        prev = current;
      }
    }
  
    return elements;
  };  

  const filteredRaws = useMemo(() => {
    const filtered = {};
    for (const [productName, productData] of Object.entries(raws)) {
      const matchesIngredient = !selectedIngredient || productIngredientMap[productName] === selectedIngredient;
      const matchesPembina = !selectedPembina || productData.id_pembina === selectedPembina;

      if (matchesIngredient && matchesPembina) {
        filtered[productName] = productData.track;
      }
    }
  
    return filtered;
  }, [selectedIngredient, selectedPembina, raws, productIngredientMap]);

  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [elements, setElements] = useState([]);
  const layoutInitialized = useRef(false);

  useEffect(() => {
    if (Object.keys(filteredRaws).length > 0) {
      const els = generateElements(filteredRaws);
      setElements(els);
      setGraphKey(prev => prev + 1); // 💥 force remount
    }
  }, [filteredRaws]);

  useEffect(() => {
    if (cyInstance && elements.length > 0) {
      const layout = cyInstance.layout({
        name: 'breadthfirst',
        animate: true,
        animationDuration: 500,
        animationEasing: 'ease-in-out',
        spacingFactor: 1.5,
        directed: true,
      });
  
      try {
        layout.run();
      } catch (err) {
        console.warn('Layout run error:', err.message);
      }
    }
  }, [cyInstance, elements]);

  const cytoscapeGraph = useMemo(() => (
    <CytoscapeComponent
      key={graphKey}
      elements={elements}
      style={{ width: '100%', height: '700px' }}
      cy={(cy) => {
  
        cy.on('render', () => {
          cy.container().style.backgroundColor = '#f0f4ff';
          cy.container().style.backgroundImage =
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'none\' stroke=\'%23d0d7e4\' stroke-width=\'1\' /%3E%3C/svg%3E")';
          cy.container().style.backgroundSize = '40px 40px';
        });
  
        setCyInstance(cy); // Save instance once
        cy.on('tap', 'node', (event) => {
          const node = event.target;
          const pos = node.renderedPosition();
          const nodeId = node.id();
          const product = raws[nodeId];
          const company = perusahaanMap[nodeId];
          const container = cy.container().getBoundingClientRect();
        
          const x = Math.min(pos.x + container.left, window.innerWidth - 300);
          const y = Math.min(pos.y + container.top, window.innerHeight - 200);
        
          // 🔴 First: remove all previous highlights
          cy.edges().removeClass('highlighted');
        
          // 🔴 Highlight path from this node
          if (product?.track) {
            const track = product.track;
            let prev = nodeId;
        
            for (let i = 1; i < track.length; i++) {
              const current = track[i];
              const edgeId = `${prev}_${current}`;
              const edge = cy.getElementById(edgeId);
              if (edge) edge.addClass('highlighted');
              prev = current;
            }
          } else {
            // Try to backtrack from clicked node (reverse path)
            cy.edges().forEach(edge => {
              if (edge.source().id() === nodeId || edge.target().id() === nodeId) {
                edge.addClass('highlighted');
              }
            });
          }
        
          // Show node popup
          setSelectedNode({
            id: node.id(),
            label: node.data('label'),
            x,
            y,
            extra: product || company
              ? {
                  jenis_perusahaan: product?.jenis_perusahaan || company?.jenis_usaha,
                  alamat_usaha: company?.alamat_usaha || null,
                  provinsi: product?.provinsi || null,
                  kota: product?.kota || null,
                  tanggal_diperbarui: product?.diperbarui_pada || company?.diperbarui_pada,
                }
              : null,
          });
        });
        
        cy.on('tap', (event) => {
          if (event.target === cy) {
            cy.edges().removeClass('highlighted');
            setSelectedNode(null);
          }
        });
        
      }}
      stylesheet={[
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            width: 70,
            height: 70,
            shape: 'ellipse',
            fontSize: 9,
            backgroundColor: '#0074D9',
            color: '#ffffff',
            textWrap: 'wrap',
            textMaxWidth: 60,
            textValign: 'center',
            textHalign: 'center',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            lineColor: '#A9A9A9',
            targetArrowColor: '#A9A9A9',
            targetArrowShape: 'triangle',
          },
        },
        {
          selector: 'node.product',
          style: {
            backgroundColor: '#2ECC40', // green
          },
        },
        {
          selector: 'node.entity',
          style: {
            backgroundColor: '#0074D9', // blue
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            lineColor: '#FF4136', // red
            targetArrowColor: '#FF4136',
            width: 4,
          },
        }        
      ]}
    />
  ), [elements, graphKey, raws]);  

  return (
    <div className="App">
      <h1>Cytoscape.js with React</h1>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="ingredient-select">Filter:</label>
        <select
          id="ingredient-select"
          onChange={(e) => setSelectedIngredient(e.target.value)}
          value={selectedIngredient}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="">All Ingredients</option>
          {Array.from(new Set(Object.values(productIngredientMap))).map((ingredient) => (
            <option key={ingredient} value={ingredient}>
              {ingredient}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="pembina-select">Filter by Pembina:</label>
        <select
          id="pembina-select"
          onChange={(e) => setSelectedPembina(e.target.value)}
          value={selectedPembina}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="">All Pembina</option>
          {perusahaan.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nama_perusahaan}
            </option>
          ))}
        </select>
      </div>
      {cytoscapeGraph}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: selectedNode.y,
            left: selectedNode.x,
            transform: 'translate(-10%, -10%)',
            background: 'white',
            border: '1px solid #ccc',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxWidth: '300px',
            width: 'max-content',
            fontSize: '14px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Node Info</h3>
          <p><strong>ID:</strong> {selectedNode.id}</p>
          <p><strong>Label:</strong> {selectedNode.label}</p>
        
          {selectedNode.extra && (
            <>
              {selectedNode.extra.jenis_perusahaan && (
                <p><strong>Jenis:</strong> {selectedNode.extra.jenis_perusahaan}</p>
              )}
              {selectedNode.extra.alamat_usaha && (
                <p><strong>Alamat:</strong> {selectedNode.extra.alamat_usaha}</p>
              )}
              {selectedNode.extra.provinsi && (
                <p><strong>Provinsi:</strong> {selectedNode.extra.provinsi}</p>
              )}
              {selectedNode.extra.kota && (
                <p><strong>Kota:</strong> {selectedNode.extra.kota}</p>
              )}
              {selectedNode.extra.tanggal_diperbarui && (
                <p><strong>Updated:</strong> {selectedNode.extra.tanggal_diperbarui}</p>
              )}
            </>
          )}
        
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              marginTop: '12px',
              backgroundColor: '#0074D9',
              color: 'white',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Close
          </button>
        </div>
      )}

    </div>
  );
}

export default Graph;