import React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function Graph() {
  const elements = [
    { data: { id: 'a', label: 'Node A' } },
    { data: { id: 'b', label: 'Node B' } },
    { data: { id: 'ab', source: 'a', target: 'b' } },
  ];

  return (
    <div className="App">
      <h1>Cytoscape.js with React</h1>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '1000px', height: '800px' }}
        stylesheet={[
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              width: 40,
              height: 40,
              backgroundColor: '#0074D9',
              color: '#ffffff',
              textValign: 'center',
              textHalign: 'center',
              fontSize: 12,
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
        ]}
      />
    </div>
  );
}

export default Graph;