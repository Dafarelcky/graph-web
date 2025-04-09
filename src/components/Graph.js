import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Graph() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [raws, setRaws] = useState([]);

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
    const fetchProductDetail = async () => {
      const username = 'ITStEr4Ta1!';
      const password = 'bzhbf8q5fbkqb-bjhefb90yfebjh-7hjebfq3745i';
      const resultDict = {};
  
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
          resultDict[product.nama_produk] = extracted;
  
          console.log(`✅ Extracted for ${product.nama_produk}:`, extracted);
  
        } catch (error) {
          console.error(`❌ Error fetching for ${product.nama_produk}:`, error.response?.status || error.message);
        }
      }
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

  const [elements, setElements] = useState([]);

  useEffect(() => {
    if (Object.keys(raws).length > 0) {
      const els = generateElements(raws);
      setElements(els);
    }
  }, [raws]);
  

  return (
    <div className="App">
      <h1>Cytoscape.js with React</h1>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '700px'}}

        cy={(cy) => {
          cy.on('render', () => {
            cy.container().style.backgroundColor = '#f0f4ff';
            cy.container().style.backgroundImage =
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'none\' stroke=\'%23d0d7e4\' stroke-width=\'1\' /%3E%3C/svg%3E")';
            cy.container().style.backgroundSize = '40px 40px';
          });
        
          // Run animated layout when Cytoscape is ready
          cy.ready(() => {
            cy.layout({
              name: 'breadthfirst',
              animate: true,
              animationDuration: 1000,
              animationEasing: 'ease-in-out',
              spacingFactor: 1.5,
              directed: true,
            }).run();
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
            selector: 'node:selected',
            style: {
              backgroundColor: '#ff9800',
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
        ]}
      />
    </div>
  );
}

export default Graph;