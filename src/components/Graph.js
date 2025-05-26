import React, { useEffect, useState, useRef, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { generatePdfReport } from './report';
import { useNavigate } from 'react-router-dom';

function Graph() {
  const { token, userEmail } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [raws, setRaws] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedPembina, setSelectedPembina] = useState('');
  const [productIngredientMap, setProductIngredientMap] = useState({});
  const [productIngredientMap_batchRaws, setProductIngredientMap_batchRaws] = useState({});
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
  // const [activeCategory, setActiveCategory] = useState(null); 
  const dropdownRef = useRef(null);
  const [isDrilldownMode, setIsDrilldownMode] = useState(false);
  const [drilldownNodeId, setDrilldownNodeId] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState('');
  const hasFetchedProducts = useRef(false);
  const hasFetchedCompanies = useRef(false);
  const hasFetchedProductDetail = useRef(false);
  const [batchProducts, setBatchProducts] =  useState([]);
  const hasFetchedBatchProduct = useRef(false);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [batchRaws, setBatchRaws] = useState({});

  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState(null);

  const INDONESIAN_PROVINCES = [
        "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi",
        "Sumatera Selatan", "Bangka Belitung", "Bengkulu", "Lampung", "DKI Jakarta",
        "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", 
        "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
        "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", 
        "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", 
        "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku", 
        "Maluku Utara", "Papua", "Papua Barat", "Papua Tengah", "Papua Pegunungan",
        "Papua Selatan", "Papua Barat Daya"
      ];

  const isDateInRange = (dateStr, start, end) => {
    const date = new Date(dateStr);
    return (!start || new Date(start) <= date) && (!end || date <= new Date(end));
  };

  const username = 'ITStEr4Ta1!';
  const password = 'bzhbf8q5fbkqb-bjhefb90yfebjh-7hjebfq3745i';

  useEffect(() => {
    // console.log('Token:', token);
    const fetchData = async () => {
      if (token && !hasFetchedProducts.current) {
        hasFetchedProducts.current = true;
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
    // console.log('Token:', token);
    const fetchData = async () => {
      if (token && !hasFetchedBatchProduct.current) {
        hasFetchedBatchProduct.current = true;
        try {
          const response = await axios.get('https://riset.its.ac.id/teratai-dev/api/v1/batch-pelaku-usaha', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // console.log('Data fetched successfully:', response.data.result.produkMaster);
          setBatchProducts(response.data.result.batchPelakuUsaha);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      if (token && !hasFetchedCompanies.current) {
        hasFetchedCompanies.current = true;
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
      const resultDict = {};
      const product_ingredient = {};
      setIsLoading(true);

      const extractProvince = (alamat) => {
        if (!alamat) return null;
        return INDONESIAN_PROVINCES.find((prov) =>
          alamat.toLowerCase().includes(prov.toLowerCase())
        ) || null;
      };
      if (!hasFetchedProductDetail.current && products.length > 0) {
        hasFetchedProductDetail.current = true;
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

            let combinedTrack = extracted;

            const allIngredientTracks = {};

            if (dataArray[0]?.bahan?.length > 1) {
              for (const b of dataArray[0].bahan) {
                try {
                  const resBahan = await axios.get(
                    `https://riset.its.ac.id/teratai-dev/api/v1/traceability/${b.id_halal}`,
                    { auth: { username, password } }
                  );
                  const pathData = Object.values(resBahan.data.result)
                    .map(x => x.nama_perusahaan || x.juru_sembelih)
                    .filter(Boolean);
                  allIngredientTracks[b.nama_bahan] = pathData;
                } catch (err) {
                  console.error('Error fetching ingredient trace:', err);
                }
              }
              combinedTrack = extracted; // only keep main product's trace in default state
            }

            const detectedProvince = extractProvince(product.alamat_usaha);

            resultDict[product.id_halal] = {
              track: combinedTrack,
              nama_produk: product.nama_produk,
              id_pembina: product.id_pembina,
              id_perusahaan: product.id_perusahaan,
              jenis_perusahaan: product.jenis_perusahaan,
              alamat_usaha: product.alamat_usaha,
              provinsi: detectedProvince,
              kota: product.kota,
              dibuat_pada: product.dibuat_pada,
              ingredientTracks: allIngredientTracks
            };
            // console.log(data)
          } catch (error) {
            console.error(`❌ Error fetching for ${product.id_halal}:`, error.response?.status || error.message);
          }
        }
      }
      setProductIngredientMap(product_ingredient);
      Object.entries(product_ingredient).forEach(([productID, ingredients]) => {
        if (ingredients.length > 1) {
          console.log(`📦 Product with multiple ingredients: ${productID}`, ingredients);
        }
      });
      setRaws(resultDict);
      setIsLoading(false); 
    };
  
    if (products.length > 0) {
      fetchProductDetail();
    }
  }, [products]);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!startDate && !endDate) {
        setIsDateFiltered(false);
        return;
      }
      const resultDict = {};
      const product_ingredient = {};
      setIsLoading(true);

      const extractProvince = (alamat) => {
        if (!alamat) return null;
        return INDONESIAN_PROVINCES.find((prov) =>
          alamat.toLowerCase().includes(prov.toLowerCase())
        ) || null;
      };

      const filteredMap = {};

      batchProducts.forEach((product) => {
        if (isDateInRange(product.dibuat_pada, startDate, endDate)) {
          const existing = filteredMap[product.id_halal];
          if (
            !existing ||
            new Date(product.diperbarui_pada) > new Date(existing.diperbarui_pada)
          ) {
            filteredMap[product.id_halal] = product;
          }
        }
      });

      const filtered = Object.values(filteredMap);

      // const result = {};
      for (const product of filtered) {
        // if(!raws[product.id_halal]) continue;
        try {
          const res = await axios.get(
            `https://riset.its.ac.id/teratai-dev/api/v1/traceability/${product.id_halal}?batch=${product.id_batch}`,
            { auth: { username, password } }
          );
          const data = res.data.result;
          const extracted = [];

          for (const key in data) {
            const item = data[key];
            if (item?.nama_perusahaan) {
              extracted.push(item.nama_perusahaan);
            } else if (item?.juru_sembelih) {
              extracted.push(item.juru_sembelih);
            }
          }
          const dataArray = Object.values(data);

          const allBahan = dataArray[0]?.bahan?.map(b => b.nama_bahan).filter(Boolean);
          if (allBahan?.length) {
            product_ingredient[product.id_halal] = allBahan;
          }

          let combinedTrack = extracted;

          const allIngredientTracks = {};

          if (dataArray[0]?.bahan?.length > 1) {
            for (const b of dataArray[0].bahan) {
              try {
                const resBahan = await axios.get(
                  `https://riset.its.ac.id/teratai-dev/api/v1/traceability/${b.id_halal}`,
                  { auth: { username, password } }
                );
                const pathData = Object.values(resBahan.data.result)
                  .map(x => x.nama_perusahaan || x.juru_sembelih)
                  .filter(Boolean);
                allIngredientTracks[b.nama_bahan] = pathData;
              } catch (err) {
                console.error('Error fetching ingredient trace:', err);
              }
            }
            combinedTrack = extracted; // only keep main product's trace in default state
          }

          const detectedProvince = extractProvince(raws[product.id_halal].alamat_usaha);

          resultDict[product.id_halal] = {
            track: combinedTrack,
            nama_produk: raws[product.id_halal].nama_produk,
            id_pembina: raws[product.id_halal].id_pembina,
            id_perusahaan: raws[product.id_halal].id_perusahaan,
            jenis_perusahaan: raws[product.id_halal].jenis_perusahaan,
            alamat_usaha: raws[product.id_halal].alamat_usaha,
            provinsi: detectedProvince,
            kota: raws[product.id_halal].kota,
            dibuat_pada: product.dibuat_pada,
            ingredientTracks: allIngredientTracks
          };
        } catch (err) {
          console.error(`❌ Failed fetching traceability for ${product.id_halal}`, err);
        }
      }
      setProductIngredientMap_batchRaws(product_ingredient);
      Object.entries(product_ingredient).forEach(([productID, ingredients]) => {
        if (ingredients.length > 1) {
          console.log(`📦 Product with multiple ingredients: ${productID}`, ingredients);
        }
      });
      console.log(resultDict)
      setBatchRaws(resultDict);
      setIsDateFiltered(true);
      setIsLoading(false); 
    };

    fetchBatchData();
  }, [startDate, endDate, batchProducts, raws]);

  const categorizedIngredients = useMemo(() => {
    const categoryKeywords = {
      "Ayam": ["Ayam", "Dada", "Karkas Ayam", "Broiler"],
      "Sapi": ["Sapi", "Iga"],
      "Kerbau": ["Kerbau"],
      "Jeroan": ["Jeroan", "Ati"],
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
      // if (raws[productID]?.track && batchRaws[productID]?.track) {
      //   console.log('🟣 RAW track:', productID, raws[productID].track);
      //   console.log('🟢 BATCH track:', productID, batchRaws[productID].track);
      // }
      
      // const chain = data[productID];
      // if (!chain || chain.length === 0) continue;

      const rawItem = data[productID];
      const chain = Array.isArray(rawItem) ? rawItem : rawItem?.track;

      if (!Array.isArray(chain) || chain.length === 0) continue;

      const productData = (isDateFiltered ? batchRaws : raws)[productID];
      const source = chain[0]; // usually "Tera Abadi"
      const rest = chain.slice(1);

      const perusahaanInfo = perusahaanMap[productData.id_perusahaan];
      const isPelaku = perusahaanInfo?.jenis_usaha?.toLowerCase() === 'pelaku_usaha';

      // 🟠 Pelaku node
      if (!addedNodes.has(productData.id_perusahaan)) {
        elements.push({
          data: { id: productData.id_perusahaan, label: source },
          classes: isPelaku ? 'entity pelaku' : 'entity',
        });
        addedNodes.add(productData.id_perusahaan);
      }

      // 🟢 Product node
      if (!addedNodes.has(productID)) {
        elements.push({
          data: { id: productID, label: productData.nama_produk },
          classes: 'product',
        });
        addedNodes.add(productID);
      }

      // 🧠 Edge: pelaku → product
      elements.push({
        data: {
          id: `${productData.id_perusahaan}_${productID}`,
          source: productData.id_perusahaan,
          target: productID,
        },
      });

      // ✅ Add Ingredient nodes + tracks (only in drilldown mode and multi-ingredient)
      // const ingredients = productIngredientMap[productID] || [];
      const ingredientTracks = productData.ingredientTracks || {};
      const ingredients = Object.keys(ingredientTracks);

      if (ingredients.length > 1) {
        const matchedIngredients =
          isDrilldownMode && filteredRaws[productID]?.matchedIngredients
            ? filteredRaws[productID].matchedIngredients
            : ingredients;

        for (const ing of matchedIngredients) {
          const ingredientTrack = productData.ingredientTracks?.[ing] || [];

          let prev = isDrilldownMode
            ? `bahan_${ing}_${productID}`
            : productID; // Start from product directly if not in drilldown

          if (isDrilldownMode) {
            const ingredientNodeId = prev;

            if (!addedNodes.has(ingredientNodeId)) {
              elements.push({
                data: { id: ingredientNodeId, label: ing },
                classes: 'ingredient',
              });
              addedNodes.add(ingredientNodeId);
            }

            // Edge: product → ingredient
            elements.push({
              data: {
                id: `${productID}_${ingredientNodeId}`,
                source: productID,
                target: ingredientNodeId,
              },
            });
          }

          // Shared trace rendering logic
          // const drilldownName = drilldownNodeId
          //   ? perusahaanMap[drilldownNodeId]?.nama_perusahaan || drilldownNodeId.replace('juru_sembelih_', '')
          //   : null;

          // let shouldRender = !isDrilldownMode; // always true outside drilldown
          // Only render this ingredient track if it includes the drilldown node
          const drilldownName = drilldownNodeId
            ? perusahaanMap[drilldownNodeId]?.nama_perusahaan || drilldownNodeId.replace('juru_sembelih_', '')
            : null;

          // Skip this entire ingredient if it doesn't go through drilldown node
          const isDrillingFromProduct = drilldownNodeId === productID;

          // if (isDrilldownMode && drilldownName && !ingredientTrack.includes(drilldownName) && !isDrillingFromProduct) {
          //   continue;
          // }

          const productTrack = productData.track || [];
          const drillIsInProductTrack =
            productTrack.includes(drilldownName) ||
            productData.id_perusahaan === drilldownNodeId;

          if (
            isDrilldownMode &&
            drilldownName &&
            !ingredientTrack.includes(drilldownName) &&
            !isDrillingFromProduct &&
            !drillIsInProductTrack
          ) {
            continue; // skip only if drilldown not in ingredient OR product path
          }

          // Now render the entire track as usual:
          // let prev = isDrilldownMode
          //   ? `bahan_${ing}_${productID}`
          //   : productID;

          for (const name of ingredientTrack) {
            // if (isDrilldownMode && drilldownName && !shouldRender) {
            //   if (name === drilldownName) {
            //     shouldRender = true;
            //   } else {
            //     continue; // skip until drilldown match
            //   }
            // }

             // now start rendering nodes after the drilldown node appears in the path
            const company = Object.values(perusahaanMap).find(c => c.nama_perusahaan === name);
            const nodeId = company?._id || `juru_sembelih_${name}`;

            if (!addedNodes.has(nodeId)) {
              elements.push({
                data: { id: nodeId, label: name },
                classes: 'entity',
              });
              addedNodes.add(nodeId);
            }

            elements.push({
              data: {
                id: `${prev}_${nodeId}`,
                source: prev,
                target: nodeId,
              },
            });

            prev = nodeId;
          }
        }
      }

      // 🧱 Add standard trace chain (if not in drilldown, or 1-ingredient only)
      // const numIngredients = productIngredientMap[productID]?.length || 0;
      const numIngredients = ingredients.length;
      if (!isDrilldownMode || numIngredients <= 1) {
        let prev = productID;
        for (const name of rest) {
          const entry = Object.values(perusahaanMap).find(c => c.nama_perusahaan === name);
          const nodeId = entry?._id || `juru_sembelih_${name}`;

          if (!addedNodes.has(nodeId)) {
            elements.push({
              data: { id: nodeId, label: name },
              classes: 'entity',
            });
            addedNodes.add(nodeId);
          }

          elements.push({
            data: {
              id: `${prev}_${nodeId}`,
              source: prev,
              target: nodeId,
            },
          });

          prev = nodeId;
        }
      }
    }

    return elements;
  };

  useEffect(() => {
    if (pendingCategoryFilter) {
      const ingredients = categorizedIngredients[pendingCategoryFilter];
      if (ingredients?.length) {
        // console.log("⏳ Applying filter for category:", pendingCategoryFilter);
        // console.log("➡️ Final ingredients being set:", ingredients);
        setFilteredIngredientList([...ingredients]);
      } else {
        setFilteredIngredientList([]);
      }
      setSelectedIngredient(null);  // also reset sub-filter
      setPendingCategoryFilter(null);
    }
  }, [pendingCategoryFilter]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return Object.entries(categorizedIngredients);
    return Object.entries(categorizedIngredients).filter(([category]) =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, categorizedIngredients]);

  const filteredRaws = useMemo(() => {
    const filtered = {};
    const sourceData = isDateFiltered ? batchRaws : raws;

    if (isDrilldownMode && drilldownNodeId) {
      const normalizedName = drilldownNodeId.replace('juru_sembelih_', '');

      for (const [productID, productData] of Object.entries(sourceData)) {
        const track = productData.track || [];
        const ingredientTracks = productData.ingredientTracks || {};

        const drilldownName =
          perusahaanMap[drilldownNodeId]?.nama_perusahaan || normalizedName;

        // Check if drilldown matches full product track
        const matchesMainTrack =
          productID === drilldownNodeId ||
          productData.id_perusahaan === drilldownNodeId ||
          track.includes(drilldownName);

        // Check for ingredient matches
        const matchingIngredients = Object.entries(ingredientTracks)
          .filter(([_, path]) =>
            path.includes(drilldownName)
          )
          .map(([ingredientName]) => ingredientName);

        // ⛔ Avoid false-positive full match: only show full product if drilldown is truly in main track
        const numIngredients = Object.keys(ingredientTracks).length;

        if (matchesMainTrack && numIngredients <= 1) {
          // Single-ingredient — include full
          filtered[productID] = { track, reason: 'main' };
        } else if (matchesMainTrack && numIngredients > 1 && matchingIngredients.length === 0) {
          // Multi-ingredient but drilldown in main track — include product only
          filtered[productID] = { track, reason: 'main-no-ing' };
        } else if (matchingIngredients.length > 0) {
          // Multi-ingredient with partial match
          filtered[productID] = {
            track,
            matchedIngredients: matchingIngredients,
            reason: 'partial-ingredient',
          };
        }
      }

      return filtered;
    }



    // console.log("🧮 Filtering with list:", filteredIngredientList);
    // console.log('🔍 Filtering raws using:', {
    //   selectedIngredient,
    //   filteredIngredientList,
    // });
  
    for (const [productID, productData] of Object.entries(sourceData)) {
      let matchesIngredient = true;

      if (selectedIngredient) {
        matchesIngredient = productIngredientMap[productID]?.includes(selectedIngredient);
      } else if (filteredIngredientList.length > 0) {
        matchesIngredient = productIngredientMap[productID]?.some(ing =>
          filteredIngredientList.includes(ing)
        );
      }

      const matchesPembina = !selectedPembina || productData.id_pembina === selectedPembina;
      const matchesProvince =
        !selectedProvince ||
        (sourceData[productID]?.provinsi === selectedProvince);
  
      const updatedAt = productData.dibuat_pada;
      const updatedDate = updatedAt ? new Date(updatedAt) : null;
      const inDateRange =
        (!startDate || (updatedDate && updatedDate >= new Date(startDate))) &&
        (!endDate || (updatedDate && updatedDate <= new Date(endDate)));
  
      if (matchesIngredient && matchesPembina && inDateRange && matchesProvince) {
        filtered[productID] = productData.track;
      }
    }
  
    return filtered;
  }, [selectedIngredient, filteredIngredientList, selectedPembina, raws, productIngredientMap, startDate, endDate, isDrilldownMode, drilldownNodeId, perusahaanMap, selectedProvince, batchRaws]);  

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
    // console.log('✅ FilteredRaws:', filteredRaws);
    // console.log('✅ Graph elements regenerated:', els);
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

  const exitDrilldownAnd = (callback) => {
    setIsDrilldownMode(false);
    setDrilldownNodeId(null);
    callback();
  };

  const cytoscapeGraph = useMemo(() => (
    <CytoscapeComponent
      key={graphKey}
      elements={elements}
      style={{ width: '100%', height: '700px' }}
      cy={(cy) => {
  
        cy.on('render', () => {
        //   <pre style={{ fontSize: '12px' }}>
        //     Selected Ingredient: {JSON.stringify(selectedIngredient)}{"\n"}
        //     Filtered Ingredient List: {JSON.stringify(filteredIngredientList)}
        //   </pre>
          cy.container().style.backgroundColor = '#f0f4ff';
          cy.container().style.backgroundImage =
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'none\' stroke=\'%23d0d7e4\' stroke-width=\'1\' /%3E%3C/svg%3E")';
          cy.container().style.backgroundSize = '40px 40px';
        });
  
        setCyInstance(cy); // Save instance once
        cy.on('tap', 'node', (event) => {
          const node = event.target;
          // const nodeData = node.data();
          // setSelectedNode({
          //   id: nodeData.id,
          //   label: nodeData.label,
          //   extra: nodeData.extra || null,
          // });
          const pos = node.renderedPosition();
          const nodeId = node.id();
          const product = (isDateFiltered ? batchRaws : raws)[nodeId];
          const product_ingredient = (isDateFiltered ? productIngredientMap_batchRaws : productIngredientMap)
          const company = perusahaanMap[nodeId];
          const isJuru = nodeId.startsWith('juru_sembelih_');
          const container = cy.container().getBoundingClientRect();
        
          const x = Math.min(pos.x + container.left, window.innerWidth - 300);
          const y = Math.min(pos.y + container.top, window.innerHeight - 200);
        
          // 🔴 First: remove all previous highlights
          cy.edges().removeClass('highlighted');
        
          if (product?.ingredientTracks && Object.keys(product.ingredientTracks).length > 0) {
            Object.entries(product.ingredientTracks).forEach(([ing, path]) => {
              let prev = `bahan_${ing}_${nodeId}`;
              
              path.forEach(currentName => {
                const currentEntry = Object.values(perusahaanMap).find(c => c.nama_perusahaan === currentName);
                const currentID = currentEntry?._id || `juru_sembelih_${currentName}`;

                // Highlight edge
                const edgeId = `${prev}_${currentID}`;
                const edge = cy.getElementById(edgeId);
                if (edge) edge.addClass('highlighted');

                // Highlight node (optional)
                const node = cy.getElementById(currentID);
                if (node) node.addClass('highlighted');

                prev = currentID;
              });
            });
          }

          // 🟡 If node is an ingredient node
          if (nodeId.startsWith('bahan_')) {
            const [_, ingName, productID] = nodeId.split('_');

            const ingredientTrack = (isDateFiltered ? batchRaws : raws)[productID]?.ingredientTracks?.[ingName];
            if (ingredientTrack?.length) {
              let prev = nodeId;

              for (const currentName of ingredientTrack) {
                const currentEntry = Object.values(perusahaanMap).find(c => c.nama_perusahaan === currentName);
                const currentID = currentEntry?._id || `juru_sembelih_${currentName}`;

                const edgeId = `${prev}_${currentID}`;
                const edge = cy.getElementById(edgeId);
                if (edge) edge.addClass('highlighted');

                const n = cy.getElementById(currentID);
                if (n) n.addClass('highlighted');

                prev = currentID;
              }
            }
          }

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
            extra: product || company || isJuru
              ? {
                  jenis_perusahaan: product?.jenis_perusahaan || company?.jenis_usaha,
                  alamat_usaha: company?.alamat_usaha || null,
                  provinsi: product?.provinsi || null,
                  kota: product?.kota || null,
                  tanggal_diperbarui: product?.dibuat_pada || company?.dibuat_pada,
                  bahan: product_ingredient[nodeId] || [],
                  id: isJuru?.id,
                  Label: isJuru?.label
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
          selector: 'node.ingredient',
          style: {
            backgroundColor: '#FFD700',
            shape: 'round-rectangle',
            fontSize: 10
          }
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
  ), [elements, graphKey, raws, perusahaanMap, productIngredientMap, batchRaws]);  

  function applyCategoryFilter(ingredients) {
      setSelectedIngredient(null); // reset sub-filter
      setFilteredIngredientList([]); // force clear
      setTimeout(() => {
        setFilteredIngredientList([...ingredients]); // set new list after event loop
      }, 0);
  }

  const hoverTimeout = useRef(null);
  return (
    <div className="App" style={{
      fontFamily: 'Poppins, sans-serif',
      backgroundColor: '#f9f6fc',
      padding: '40px',
      minHeight: '100vh',
      color: '#333'
      // position: 'relative'
    }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px' 
    }}>
      <h1 style={{
        color: '#5e2ca5',
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '10px'
      }}>
        Trace Halal
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <button
          disabled={isLoading}
          onClick={() =>
            generatePdfReport({
              raws: isDateFiltered ? batchRaws : raws,
              filteredRaws,
              productIngredientMap,
              perusahaanMap,
              selectedIngredient,
              filteredIngredientList,
              selectedPembina,
              startDate,
              endDate,
              categorizedIngredients,
              loggedInUser: userEmail,
            })
          }
          style={{
            backgroundColor: '#6c3bb5',
            color: 'white',
            padding: '10px 18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          Download Report PDF
        </button>

        <button
          disabled={isLoading}
          onClick={() => {
            const newWindow = window.open('', '_blank');
            const stateData = {
              raws: isDateFiltered ? batchRaws : raws,
              perusahaanMap,
              productIngredientMap,
              filteredRaws,
            };
            newWindow.localStorage.setItem('statisticsState', JSON.stringify(stateData));
            newWindow.location.href = '/statistics';
          }}
          style={{
            marginTop: '10px',
            backgroundColor: '#6c3bb5',
            color: 'white',
            padding: '10px 18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          Lihat Statistik Jejak
        </button>
      </div>
      {/* {isDrilldownMode && (
        <button
          onClick={() => {
            setIsDrilldownMode(false);
            setDrilldownNodeId(null);
          }}
          style={{
            top: 10,
            right: 10,
            marginLeft: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: 'fit-content',
            zIndex: 1000,
          }}
        >
          Kembali ke Filter
        </button>
      )} */}
    </div>

      {/* <pre>
        Selected Ingredient: {JSON.stringify(selectedIngredient, null, 2)}
        {'\n'}
        Filtered Ingredients: {JSON.stringify(filteredIngredientList, null, 2)}
      </pre> */}

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <label 
          style={{
            fontWeight: '500',
            color: '#5e2ca5',
            marginRight: '8px'
          }}
          htmlFor="ingredient-search"
        >Kategori Bahan Baku:</label>
        <input
          disabled={isLoading}
          id="ingredient-search"
          type="text"
          placeholder="Search category..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setHoveredCategory(null);
            setIsDropdownVisible(true);

            if (value.trim() === '') {
                setFilteredIngredientList([]); // only reset graph when search is fully cleared
                setSelectedIngredient(null);
            }
          }}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginLeft: '10px',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}

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

                    exitDrilldownAnd(() => {
                      setPendingCategoryFilter(category);
                      setSearchTerm(category);
                      setIsDropdownVisible(false);
                      setHoveredCategory(null);
                    });
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
                      console.log(`🟧 Clicked Sub-Ingredient: ${sub}`);

                      exitDrilldownAnd(() => {
                        setSelectedIngredient(sub);
                        setFilteredIngredientList([]);
                        setSearchTerm(sub);
                        setHoveredCategory(null);
                        setIsDropdownVisible(false);
                      });
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
        <button 
        disabled={isLoading}
        onClick={() => {
            setFilteredIngredientList([]);
            setSelectedIngredient(null);
            setSearchTerm('');
            }}>
            Reset Filter
        </button>

      </div>

      <div style={{ marginBottom: '20px' }}>
      <label 
        style={{
          fontWeight: '500',
          color: '#5e2ca5',
          marginRight: '8px'
        }}
      >
        Provinsi:
      </label>
      <select
        disabled={isLoading}
        value={selectedProvince}
        onChange={(e) => {
          const val = e.target.value;
          exitDrilldownAnd(() => setSelectedProvince(val));
        }}
        style={{
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          marginLeft: '10px',
          fontFamily: 'inherit',
          fontSize: '14px'
        }}
      >
        <option value="">All Provinsi</option>
        {INDONESIAN_PROVINCES.map((prov) => (
          <option key={prov} value={prov}>{prov}</option>
        ))}
      </select>
    </div>

      <div style={{ marginBottom: '20px' }}>
        <label 
          style={{
            fontWeight: '500',
            color: '#5e2ca5',
            marginRight: '8px'
          }}
        htmlFor="pembina-select"
        >
          Pembina:
        </label>
        <select
          disabled={isLoading}
          id="pembina-select"
          onChange={(e) => {
            const val = e.target.value;
            exitDrilldownAnd(() => setSelectedPembina(val));
          }}
          value={selectedPembina}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginLeft: '10px',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
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
        <label 
          style={{
            fontWeight: '500',
            color: '#5e2ca5',
            marginRight: '8px'
          }}
        >
        Tanggal Batch Produksi:
        </label>
        <input
          type="date"
          value={pendingStartDate}
          onChange={(e) => setPendingStartDate(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginLeft: '10px',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
        />
        <input
          type="date"
          value={pendingEndDate}
          onChange={(e) => setPendingEndDate(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginLeft: '10px',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => {
            if (pendingStartDate && pendingEndDate) {
              exitDrilldownAnd(() => {
                setStartDate(pendingStartDate);
                setEndDate(pendingEndDate);
              });
            }
          }}
          disabled={!pendingStartDate || !pendingEndDate || isLoading}
          style={{
            marginLeft: '10px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#5e2ca5',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          Cari
        </button>
        <button
          onClick={() => {
            // Reset all date-related states
            exitDrilldownAnd(() => {
              setStartDate('');
              setEndDate('');
              setPendingStartDate('');
              setPendingEndDate('');
              setIsDateFiltered(false);
            });
          }}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            backgroundColor: '#5e2ca5',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ position: 'relative' }}>
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

      {isDrilldownMode && (
        <button
          onClick={() => {
            setIsDrilldownMode(false);
            setDrilldownNodeId(null);
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          Kembali ke Filter
        </button>
      )}
    </div>

      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: selectedNode.y,
            left: selectedNode.x,
            transform: 'translate(-10%, -10%)',
            background: 'white',
            border: '1px solid #e0c8f2',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(108, 59, 181, 0.15)',
            zIndex: 1000,
            maxWidth: '300px',
            width: 'max-content',
            fontSize: '14px',
            color: '#333'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Profil Detail</h3>
          <p><strong>ID:</strong> {selectedNode.id}</p>
          <p><strong>Nama:</strong> {selectedNode.label}</p>
        
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
              {!isDrilldownMode && (
                (() => {
                  const isEntity = selectedNode.extra?.jenis_perusahaan;
                  const isProduct = selectedNode.extra?.bahan;
                  const isJuru = selectedNode.id?.startsWith('juru_sembelih_');
                  if (isEntity || isJuru || isProduct) {
                    return (
                      <button
                        disabled={isLoading}
                        onClick={() => {
                          exitDrilldownAnd(() => {
                            setDrilldownNodeId(selectedNode.id);
                            setIsDrilldownMode(true);
                            setSelectedNode(null);
                          });
                        }}
                        style={{
                          marginTop: '8px',
                          backgroundColor: '#0074D9',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        Tampilkan Jejak Lengkap
                      </button>
                    );
                  }
                  return null;
                })()
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