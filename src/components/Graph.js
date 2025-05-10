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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState('');
  const [filteredIngredientList, setFilteredIngredientList] = useState([]);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null); // optional, for future use
  const dropdownRef = useRef(null);

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
            companyMap[c._id] = c;
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
      setIsLoading(true);
  
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

          const allBahan = dataArray[0]?.bahan?.map(b => b.nama_bahan).filter(Boolean);
          if (allBahan?.length) {
            product_ingredient[product.id_halal] = allBahan;
          }
          resultDict[product.id_halal] = {
            track: extracted,
            nama_produk: product.nama_produk,
            id_pembina: product.id_pembina,
            id_perusahaan: product.id_perusahaan,
            jenis_perusahaan: product.jenis_perusahaan,
            provinsi: product.provinsi,
            kota: product.kota,
            diperbarui_pada: product.diperbarui_pada
          };


          
          // console.log(data)
  
        } catch (error) {
          console.error(`❌ Error fetching for ${product.id_halal}:`, error.response?.status || error.message);
        }
      }
      setProductIngredientMap(product_ingredient);
      setRaws(resultDict);
      setIsLoading(false); 
    };
  
    if (products.length > 0) {
      fetchProductDetail();
    }
  }, [products]);

  const categorizedIngredients = useMemo(() => {
    const categoryKeywords = {
      "Daging Ayam": ["Ayam", "Dada", "Karkas Ayam", "Broiler"],
      "Daging Sapi": ["Sapi", "Iga", "Boneless"],
      "Daging Kerbau": ["Kerbau"],
      "Jeroan": ["Jeroan"],
      "Beras": ["Beras"],
      "Mie / Bihun": ["Mie", "BIHUN", "Bihun"],
      "Olahan": ["Bakso", "Mojo", "Segar"],
      "Unggas Lain": ["Unggas"],
    };

    const ingredientSet = new Set(Object.values(productIngredientMap).flat());
    const categorized = {};

    for (const ingredient of ingredientSet) {
      let matched = false;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
          if (ingredient.toLowerCase().includes(keyword.toLowerCase())) {
            if (!categorized[category]) categorized[category] = new Set();
            categorized[category].add(ingredient);
            matched = true;
          }
        }
      }

      if (!matched) {
        if (!categorized["Lainnya"]) categorized["Lainnya"] = new Set();
        categorized["Lainnya"].add(ingredient);
      }
    }

    // Convert Sets to arrays and sort
    const final = {};
    for (const [category, ingredients] of Object.entries(categorized)) {
      final[category] = Array.from(ingredients).sort();
    }

    return final;
  }, [productIngredientMap]);

  const generateElements = (data) => {
    const elements = [];
    const addedNodes = new Set();
  
    for (const productID in data) {
      const chain = data[productID];
  
      if (!chain || chain.length === 0) continue;
  
      const source = chain[0]; // "Tera Abadi"
      const rest = chain.slice(1);
  
      // Add node: "Tera Abadi"
      if (!addedNodes.has(raws[productID].id_perusahaan)) {
        const perusahaanInfo = perusahaanMap[raws[productID].id_perusahaan];
        const isPelaku = perusahaanInfo?.jenis_usaha?.toLowerCase() === 'pelaku_usaha';
        elements.push({
          data: { id: raws[productID].id_perusahaan, label: source },
          classes: isPelaku ? 'entity pelaku' : 'entity'
        });
        addedNodes.add(raws[productID].id_perusahaan);
      }
  
      // Add product node
      if (!addedNodes.has(productID)) {
        elements.push({ data: { id: productID, label: raws[productID].nama_produk }, classes: 'product' });
        addedNodes.add(productID);
      }
  
      // Edge: Tera Abadi → Product
      elements.push({
        data: {
          id: `${raws[productID].id_perusahaan}_${productID}`,
          source: raws[productID].id_perusahaan,
          target: productID,
        },
      });
  
      // Continue the chain: product → next → next → ...
      let prev = productID;
      for (const currentName of rest) {
        // Find the perusahaan by name
        const currentEntry = Object.values(perusahaanMap).find(c => c.nama_perusahaan === currentName);
        const currentID = currentEntry?._id || `juru_sembelih_${currentName}`; // fallback

        if (!addedNodes.has(currentID)) {
          elements.push({ data: { id: currentID, label: currentName }, classes: 'entity' });
          addedNodes.add(currentID);
        }

        elements.push({
          data: {
            id: `${prev}_${currentID}`,
            source: prev,
            target: currentID,
          },
        });

        prev = currentID;
      }
    }
  
    return elements;
  };  

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return Object.entries(categorizedIngredients);
    return Object.entries(categorizedIngredients).filter(([category]) =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, categorizedIngredients]);

  const filteredRaws = useMemo(() => {
    const filtered = {};
  
    for (const [productID, productData] of Object.entries(raws)) {
      let matchesIngredient = false;
        if (filteredIngredientList.length > 0) {
          matchesIngredient = productIngredientMap[productID]?.some(ing => filteredIngredientList.includes(ing));
        } else if (selectedIngredient) {
          matchesIngredient = productIngredientMap[productID]?.includes(selectedIngredient);
        } else {
          matchesIngredient = true;
        }

      const matchesPembina = !selectedPembina || productData.id_pembina === selectedPembina;
  
      const updatedAt = productData.diperbarui_pada;
      const updatedDate = updatedAt ? new Date(updatedAt) : null;
      const inDateRange =
        (!startDate || (updatedDate && updatedDate >= new Date(startDate))) &&
        (!endDate || (updatedDate && updatedDate <= new Date(endDate)));
  
      if (matchesIngredient && matchesPembina && inDateRange) {
        filtered[productID] = productData.track;
      }
    }
  
    return filtered;
  }, [selectedIngredient, selectedPembina, raws, productIngredientMap, startDate, endDate]);  

  useEffect(() => {
    setHoveredCategory(null);
    setIsDropdownVisible(searchTerm.trim().length > 0);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownVisible(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [elements, setElements] = useState([]);
  const layoutInitialized = useRef(false);

  useEffect(() => {
    const els = generateElements(filteredRaws);
    setElements(els);
    setGraphKey(prev => prev + 1); // remount
  }, [filteredRaws]);

  useEffect(() => {
    if (cyInstance && elements.length > 0) {
      const layout = cyInstance.layout({
        name: 'breadthfirst',
        spacingFactor: 1.8, // more spacing between nodes
        directed: true,
        animate: true,
        animationDuration: 500,
        animationEasing: 'ease-in-out',
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
              const currentName = track[i];
              const currentEntry = Object.values(perusahaanMap).find(c => c.nama_perusahaan === currentName);
              const currentID = currentEntry?._id || `juru_sembelih_${currentName}`;
              const edgeId = `${prev}_${currentID}`;
              const edge = cy.getElementById(edgeId);
              if (edge) edge.addClass('highlighted');
              prev = currentID;
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
                  bahan: productIngredientMap[nodeId] || [],
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
            width: 2,
            lineColor: '#999',
            curveStyle: 'bezier', // 🧠 allow for curved arrows
            targetArrowShape: 'triangle',
            targetArrowColor: '#999',
            arrowScale: 1.5, // 🆙 make arrows larger
            midTargetArrowShape: 'none',
            sourceArrowShape: 'none',
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
          selector: 'node.pelaku',
          style: {
            backgroundColor: '#FF851B', // orange
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            lineColor: '#FF4136',
            targetArrowColor: '#FF4136',
            targetArrowShape: 'triangle',
            arrowScale: 2, // more prominent on highlight
            width: 4,
            curveStyle: 'bezier',
          },
        },     
      ]}
    />
  ), [elements, graphKey, raws, perusahaanMap, productIngredientMap]);  

  const hoverTimeout = useRef(null);
  return (
    <div className="App">
      <h1>Cytoscape.js with React</h1>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <label htmlFor="ingredient-search">Filter by Category or Ingredient:</label>
        <input
          id="ingredient-search"
          type="text"
          placeholder="Search category..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHoveredCategory(null);         // ensures clean reset
            setIsDropdownVisible(true);       // dropdown is visible on typing
            setFilteredIngredientList([]);    // clear previous category filter
          }}
          style={{ marginLeft: '10px', padding: '5px', width: '250px' }}
        />
        {isDropdownVisible && (
          <div
            ref={dropdownRef}
            onMouseEnter={() => {
              clearTimeout(hoverTimeout.current);
              setIsHoveringDropdown(true);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => {
                setIsHoveringDropdown(false);
                setHoveredCategory(null);
              }, 200);
            }}
            style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              display: 'flex',
              zIndex: 1000,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              fontFamily: 'sans-serif',
            }}
          >
            {/* Category List */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '200px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredCategories.map(([category]) => (
                <li
                  key={category}
                  onMouseEnter={() => setHoveredCategory(category)}
                  onMouseDown={() => {
                    const ingredients = categorizedIngredients[category] || [];
                    setSelectedIngredient(null);              // Clear subcategory filter
                    setFilteredIngredientList(ingredients);  // Apply new category filter
                    setSearchTerm('');
                    setIsDropdownVisible(false);
                    setHoveredCategory(null);
                  }}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    background: hoveredCategory === category ? '#f0f0f0' : '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <span>{category}</span>
                  <span style={{ fontSize: '10px', color: '#555' }}>▶</span>
                </li>
              ))}
            </ul>

            {/* Subcategory List */}
            {hoveredCategory && isHoveringDropdown && (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  width: '220px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  background: '#fff',
                  borderLeft: '1px solid #ccc',
                }}
              >
                {(categorizedIngredients[hoveredCategory] || []).map((sub) => (
                  <li
                    key={sub}
                    onMouseDown={() => {
                      setSelectedIngredient(sub);
                      setFilteredIngredientList([]);
                      setSearchTerm('');
                      setHoveredCategory(null);
                      setIsDropdownVisible(false);
                    }}
                    style={{
                      padding: '10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
      <div style={{ marginBottom: '20px' }}>
        <label>Filter by Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
      </div>

      {cytoscapeGraph}

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '20px 30px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            fontSize: '16px',
            color: '#555',
            zIndex: 1000,
          }}
        >
          ⏳ Memuat data produk dan jejak distribusi...
        </div>
      )}

      {!isLoading && elements.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '20px 30px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            fontSize: '16px',
            color: '#555',
            zIndex: 1000,
          }}
        >
          ❗Tidak ada produk yang memenuhi filter.
        </div>
      )}

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
              {selectedNode.extra?.bahan?.length > 0 && (
                <p><strong>Bahan:</strong> {selectedNode.extra.bahan.join(', ')}</p>
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