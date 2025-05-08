
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

function App() {
  const cyRef = useRef(null);
  const [cyInstance, setCyInstance] = useState(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);

  const [firstForm, setFirstForm] = useState({ name: '', gender: 'Other', age: '', dob: '' });
  const [parentForm, setParentForm] = useState({ father: '', mother: '', ageFather: '', ageMother: '', dobFather: '', dobMother: '' });
  const [partnerForm, setPartnerForm] = useState({ newName: '', existingId: '', gender: 'Other', age: '', dob: '' });
  const [childForm, setChildForm] = useState({ name: '', gender: 'Other', age: '', dob: '' });
  const [editForm, setEditForm] = useState({ name: '', gender: 'Other', age: '', dob: '' });
  const [findForm, setFindForm] = useState({ from: '', to: '', result: '' });
  const [freeNodeForm, setFreeNodeForm] = useState({ name: '', gender: 'Other', age: '', dob: '' });

  // Track generations for proper layout
  const getGeneration = (id) => {
    const node = nodes.find(n => n.id === id);
    return node ? node.generation : 0;
  };

  useEffect(() => {
    if (cyInstance) cyInstance.destroy();
    
    const cy = cytoscape({
      container: cyRef.current,
      elements: [
        ...nodes.map(n => ({
          data: {
            id: n.id,
            label: n.name,
            gender: n.gender,
            generation: n.generation
          }
        })),
        ...edges.map(e => ({
          data: { 
            source: e.source, 
            target: e.target, 
            type: e.type,
            curveStyle: e.type === 'partner' ? 'bezier' : 'unbundled-bezier'
          }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': ele => {
              const g = ele.data('gender');
              return g === 'Male' ? '#89CFF0' : g === 'Female' ? '#FFB6C1' : '#DDD';
            },
            shape: 'roundrectangle',
            width: 120,
            height: 60,
            'border-color': '#333',
            'border-width': ele => ele.id() === selected ? 4 : 2
          }
        },
        {
          selector: 'edge[type = "parent"]',
          style: {
            'line-color': '#555',
            width: 2,
            'curve-style': 'unbundled-bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#555'
          }
        },
        {
          selector: 'edge[type = "partner"]',
          style: {
            'line-color': '#8B4513',
            width: 3,
            'curve-style': 'bezier',
            'line-style': 'dashed'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 80,
        edgeSep: 50,
        rankSep: 100,
        ranker: 'network-simplex',
        nodeRank: node => node.data('generation')
      }
    });

    cy.on('tap', 'node', ev => {
      setSelected(ev.target.id());
      const nodeData = nodes.find(n => n.id === ev.target.id());
      if (nodeData) {
        setEditForm({ 
          name: nodeData.name || '', 
          gender: nodeData.gender || 'Other', 
          age: nodeData.age || '', 
          dob: nodeData.dob || ''
        });
      }
      setMode(null);
    });

    // Apply layout after all elements are added
    const layout = cy.layout({
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 80,
      edgeSep: 50,
      rankSep: 100,
      ranker: 'network-simplex',
      nodeRank: node => node.data('generation')
    });
    
    layout.run();
    
    // Improved partner positioning - ensure they're side by side
    edges.forEach(edge => {
      if (edge.type === 'partner') {
        const sourceNode = cy.getElementById(edge.source);
        const targetNode = cy.getElementById(edge.target);
        
        if (sourceNode && targetNode) {
          const sourcePos = sourceNode.position();
          const targetPos = targetNode.position();
          
          // Position partners horizontally aligned
          const avgY = (sourcePos.y + targetPos.y) / 2;
          const sourceX = sourcePos.x - 100; // Adjust spacing as needed
          const targetX = sourcePos.x + 100;
          
          sourceNode.position({ x: sourceX, y: avgY });
          targetNode.position({ x: targetX, y: avgY });
        }
      }
    });
    
    setCyInstance(cy);
    return () => cy.destroy();
  }, [nodes, edges, selected]);

  const genId = base => {
    let id = base.replace(/\s+/g, '_');
    let i = 1;
    while (nodes.some(n => n.id === id)) id = `${base}_${i++}`;
    return id;
  };

  const addNode = ({ name, gender, age, dob, id, generation = 0 }) => {
    const realId = id || genId(name || 'node');
    setNodes(ns => {
      if (ns.some(n => n.id === realId)) return ns;
      return [...ns, { id: realId, name, gender, age, dob, generation }];
    });
    return realId;
  };

  const addEdge = (src, dst, type = 'parent') => {
    if (!src || !dst) return;
    setEdges(es => {
      if (es.some(e => 
        (e.source === src && e.target === dst && e.type === type) || 
        (e.source === dst && e.target === src && e.type === type)
      )) return es;
      return [...es, { source: src, target: dst, type }];
    });
  };

  const handleReset = () => {
    setNodes([]); setEdges([]); setSelected(null); setMode(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    const hasChildren = edges.some(e => e.source === selected && e.type === 'parent');
    if (hasChildren) {
      alert("Cannot delete: This node has children connected.");
      return;
    }
    setNodes(ns => ns.filter(n => n.id !== selected));
    setEdges(es => es.filter(e => e.source !== selected && e.target !== selected));
    setSelected(null);
  };

  const handleAddFirst = () => {
    if (!firstForm.name.trim()) return;
    const id = addNode({ ...firstForm, generation: 0 });
    setSelected(id);
    setFirstForm({ name: '', gender: 'Other', age: '', dob: '' });
  };

  const handleAddParent = () => {
    if (!selected) return;
    
    const selectedNode = nodes.find(n => n.id === selected);
    const parentGeneration = (selectedNode?.generation || 0) - 1;
    
    const dadId = addNode({ 
      name: parentForm.father || 'Father', 
      gender: 'Male', 
      age: parentForm.ageFather, 
      dob: parentForm.dobFather,
      generation: parentGeneration
    });
    
    const momId = addNode({ 
      name: parentForm.mother || 'Mother', 
      gender: 'Female', 
      age: parentForm.ageMother, 
      dob: parentForm.dobMother,
      generation: parentGeneration
    });
    
    // Connect parents as partners
    addEdge(dadId, momId, 'partner');
    
    // Connect both parents to child
    addEdge(dadId, selected, 'parent');
    addEdge(momId, selected, 'parent');
    
    setParentForm({ father: '', mother: '', ageFather: '', ageMother: '', dobFather: '', dobMother: '' });
    setMode(null);
  };

  const handleAddPartner = () => {
    if (!selected) return;
    
    const selectedNode = nodes.find(n => n.id === selected);
    const partnerGeneration = selectedNode?.generation || 0;
    
    let pid = partnerForm.existingId;
    if (!pid && partnerForm.newName.trim()) {
      pid = addNode({ 
        name: partnerForm.newName, 
        gender: partnerForm.gender, 
        age: partnerForm.age, 
        dob: partnerForm.dob,
        generation: partnerGeneration
      });
    }
    if (!pid) return;
    
    // Connect as partners
    addEdge(selected, pid, 'partner');
    
    setPartnerForm({ newName: '', existingId: '', gender: 'Other', age: '', dob: '' });
    setMode(null);
  };

  const handleAddChild = () => {
    if (!selected || !childForm.name.trim()) return;
    
    const selectedNode = nodes.find(n => n.id === selected);
    const childGeneration = (selectedNode?.generation || 0) + 1;
    
    const cid = addNode({ 
      ...childForm, 
      generation: childGeneration
    });
    
    // Find if selected has a partner
    const partnerEdge = edges.find(e => 
      (e.source === selected || e.target === selected) && e.type === 'partner'
    );
    
    // Connect to both parents if they exist
    if (partnerEdge) {
      const partnerId = partnerEdge.source === selected ? partnerEdge.target : partnerEdge.source;
      addEdge(partnerId, cid, 'parent');
    }
    addEdge(selected, cid, 'parent');
    
    setChildForm({ name: '', gender: 'Other', age: '', dob: '' });
    setMode(null);
  };

  const handleAddSibling = () => {
    if (!selected || !childForm.name.trim()) return;
    
    const selectedNode = nodes.find(n => n.id === selected);
    const siblingGeneration = selectedNode?.generation || 0;
    
    // Find parents of selected node
    const parents = edges
      .filter(e => e.target === selected && e.type === 'parent')
      .map(e => e.source);
    
    // If no parents exist, create default parents
    if (parents.length === 0) {
      const dadId = addNode({ 
        name: 'Father', 
        gender: 'Male', 
        generation: siblingGeneration - 1
      });
      
      const momId = addNode({ 
        name: 'Mother', 
        gender: 'Female', 
        generation: siblingGeneration - 1
      });
      
      addEdge(dadId, momId, 'partner');
      addEdge(dadId, selected, 'parent');
      addEdge(momId, selected, 'parent');
      parents.push(dadId, momId);
    }
    
    const cid = addNode({ 
      ...childForm, 
      generation: siblingGeneration
    });
    
    // Connect to all found parents
    parents.forEach(parentId => {
      addEdge(parentId, cid, 'parent');
    });
    
    setChildForm({ name: '', gender: 'Other', age: '', dob: '' });
    setMode(null);
  };

  const handleAddFreeNode = () => {
    if (!freeNodeForm.name.trim()) return;
    const id = addNode({ ...freeNodeForm });
    setSelected(id);
    setFreeNodeForm({ name: '', gender: 'Other', age: '', dob: '' });
    setMode(null);
  };

  const handleEdit = () => {
    setNodes(ns => ns.map(n =>
      n.id === selected
        ? { 
            ...n, 
            name: editForm.name || n.name, 
            gender: editForm.gender, 
            age: editForm.age || n.age, 
            dob: editForm.dob || n.dob 
          }
        : n
    ));
    setMode(null);
  };

  // Improved relationship finder with accurate terminology
  // const findRelationship = (fromId, toId) => {
  //   if (fromId === toId) return "Same person";
  
  //   // Helper functions
  //   const getName = id => nodes.find(n => n.id === id)?.name || id;
  //   const getGender = id => nodes.find(n => n.id === id)?.gender || 'Other';
  //   const getGeneration = id => nodes.find(n => n.id === id)?.generation || 0;
  
  //   // BFS queue tracks complete relationship chain
  //   const queue = [{
  //     node: fromId,
  //     path: [],
  //     relationships: [] // Stores {type, direction, viaNode} for each step
  //   }];
    
  //   const visited = new Set([fromId]);
  //   const allPaths = [];
  
  //   while (queue.length > 0) {
  //     const {node, path, relationships} = queue.shift();
      
  //     // Get all edges connected to current node
  //     const connectedEdges = edges.filter(e => 
  //       e.source === node || e.target === node
  //     );
  
  //     for (const edge of connectedEdges) {
  //       const nextNode = edge.source === node ? edge.target : edge.source;
  //       const direction = edge.source === node ? 'out' : 'in';
        
  //       if (nextNode === toId) {
  //         // Found a complete path
  //         const completePath = [...path, node, nextNode];
  //         const completeRelationships = [...relationships, {
  //           type: edge.type,
  //           direction,
  //           viaNode: node
  //         }];
  //         allPaths.push({
  //           path: completePath,
  //           relationships: completeRelationships
  //         });
  //         continue;
  //       }
        
  //       if (!visited.has(nextNode)) {
  //         visited.add(nextNode);
  //         queue.push({
  //           node: nextNode,
  //           path: [...path, node],
  //           relationships: [...relationships, {
  //             type: edge.type,
  //             direction,
  //             viaNode: node
  //           }]
  //         });
  //       }
  //     }
  //   }
  
  //   if (allPaths.length === 0) return "No relationship found";
  
  //   // Select the shortest path for primary relationship
  //   const primaryPath = allPaths.reduce((shortest, current) => 
  //     current.path.length < shortest.path.length ? current : shortest
  //   );
  
  //   return analyzeRelationship(fromId, toId, primaryPath, getName, getGender, getGeneration);
  // };


  // const analyzeRelationship = (fromId, toId, pathData, getName, getGender) => {
  //   const { path, relationships } = pathData;
  //   const fromGender = getGender(fromId);
    
  //   // Convert path to relationship steps
  //   const steps = [];
  //   for (let i = 0; i < relationships.length; i++) {
  //     const rel = relationships[i];
  //     const nextNode = path[i+1];
  //     const nextGender = getGender(nextNode);
      
  //     steps.push({
  //       type: rel.type === 'parent' 
  //         ? (rel.direction === 'out' ? 'to_child' : 'to_parent')
  //         : 'partner',
  //       gender: nextGender,
  //       node: nextNode
  //     });
  //   }
  
  //   // Use the modular relationship checkers
  //   return describeRelationshipChain(fromId, toId, steps, getName, fromGender);
  // };
  // const describeRelationshipChain = (fromId, toId, steps, getName, fromGender) => {
  //   // First try standard relationships
  //   const standard = checkStandardRelationships(fromId, toId, steps, getName, fromGender);
  //   if (standard) return standard;
  
  //   // Then try in-law relationships
  //   const inLaw = checkInLawRelationships(fromId, toId, steps, getName, fromGender);
  //   if (inLaw) return inLaw;
  
  //   // Finally try cousin/uncle/aunt relationships
  //   const family = checkFamilyRelationships(fromId, toId, steps, getName, fromGender);
  //   if (family) return family;
  
  //   // Fallback to path description
  //   return buildPathDescription(fromId, toId, steps, getName);
  // };
  
  const findRelationship = (fromId, toId) => {
    if (fromId === toId) return "Same person";
  
    const getName = id => nodes.find(n => n.id === id)?.name || id;
    const getGender = id => nodes.find(n => n.id === id)?.gender || 'Other';
  
    // BFS implementation with invisible sibling connections
    const queue = [{
      node: fromId,
      path: [],
      relationships: [],
      viaSibling: false
    }];
    
    const visited = new Set([fromId]);
    const allPaths = [];
  
    while (queue.length > 0) {
      const { node, path, relationships, viaSibling } = queue.shift();
      
      // Get all edges connected to current node
      const connectedEdges = edges.filter(e => 
        e.source === node || e.target === node
      );
  
      // Add invisible sibling connections
      if (!viaSibling) {
        const parents = edges
          .filter(e => e.target === node && e.type === 'parent')
          .map(e => e.source);
        
        if (parents.length > 0) {
          const siblings = edges
            .filter(e => parents.includes(e.source) && e.type === 'parent' && e.target !== node)
            .map(e => e.target);
          
          for (const sibling of siblings) {
            if (!visited.has(sibling)) {
              visited.add(sibling);
              queue.push({
                node: sibling,
                path: [...path, node],
                relationships: [...relationships, {
                  type: 'sibling',
                  direction: 'out',
                  viaNode: node
                }],
                viaSibling: true
              });
            }
          }
        }
      }
  
      for (const edge of connectedEdges) {
        const nextNode = edge.source === node ? edge.target : edge.source;
        const direction = edge.source === node ? 'out' : 'in';
        
        if (nextNode === toId) {
          allPaths.push({
            path: [...path, node, nextNode],
            relationships: [...relationships, {
              type: edge.type,
              direction,
              viaNode: node
            }]
          });
          continue;
        }
        
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push({
            node: nextNode,
            path: [...path, node],
            relationships: [...relationships, {
              type: edge.type,
              direction,
              viaNode: node
            }],
            viaSibling: false
          });
        }
      }
    }
  
    if (allPaths.length === 0) return "No relationship found";
  
    // Select the shortest valid path
    const primaryPath = allPaths.reduce((shortest, current) => 
      current.path.length < shortest.path.length ? current : shortest
    );
  
    return analyzeRelationship(fromId, toId, primaryPath, getName, getGender);
  };
  
  const analyzeRelationship = (fromId, toId, pathData, getName, getGender) => {
    const { path, relationships } = pathData;
    const fromGender = getGender(fromId);
    
    // Convert path to relationship steps
    const steps = [];
    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const nextNode = path[i+1];
      const nextGender = getGender(nextNode);
      
      if (rel.type === 'sibling') {
        steps.push({
          type: 'sibling',
          gender: nextGender,
          node: nextNode
        });
      } else if (rel.type === 'parent') {
        steps.push({
          type: rel.direction === 'out' ? 'to_child' : 'to_parent',
          gender: nextGender,
          node: nextNode
        });
      } else if (rel.type === 'partner') {
        steps.push({ 
          type: 'partner',
          gender: nextGender,
          node: nextNode 
        });
      }
    }
  
    // Analyze relationship steps
    return describeRelationship(fromId, toId, steps, getName, fromGender);
  };
  
  const describeRelationship = (fromId, toId, steps, getName, fromGender) => {
    const stepTypes = steps.map(s => s.type).join('-');
    const stepGenders = steps.map(s => s.gender);
  
    // Direct relationships
    if (steps.length === 1) {
      const step = steps[0];
      if (step.type === 'to_parent') {
        return `${getName(fromId)} is ${getName(toId)}'s ${step.gender === 'Male' ? 'son' : 'daughter'}`;
      }
      if (step.type === 'to_child') {
        return `${getName(fromId)} is ${getName(toId)}'s ${step.gender === 'Male' ? 'father' : 'mother'}`;
      }
      if (step.type === 'partner') {
        return `${getName(fromId)} is ${getName(toId)}'s ${step.gender === 'Male' ? 'husband' : 'wife'}`;
      }
      if (step.type === 'sibling') {
        return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'brother' : 'sister'}`;
      }
    }
  
    // Parent relationships
    if (stepTypes === 'to_parent-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${stepGenders[1] === 'Male' ? 'grandfather' : 'grandmother'}`;
    }
  
    // Child relationships
    if (stepTypes === 'to_child-to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'grandson' : 'granddaughter'}`;
    }
  
    // Sibling relationships
    if (stepTypes === 'to_parent-to_child' || stepTypes === 'to_parent-sibling') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'brother' : 'sister'}`;
    }
  
    // Uncle/Aunt relationships
    if (stepTypes === 'to_parent-to_child-partner' || 
        stepTypes === 'to_parent-sibling-partner') {
      const parentGender = stepGenders[0];
      return `${getName(fromId)} is ${getName(toId)}'s ${parentGender === 'Male' ? 'paternal' : 'maternal'} ${fromGender === 'Male' ? 'uncle' : 'aunt'}`;
    }
  
    // Nephew/Niece relationships
    if (stepTypes === 'partner-to_child-to_child' || 
        stepTypes === 'sibling-to_child-to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'nephew' : 'niece'}`;
    }
  
    // In-law relationships
    if (stepTypes === 'to_parent-partner') {
      return `${getName(fromId)} is ${getName(toId)}'s ${stepGenders[1] === 'Male' ? 'father-in-law' : 'mother-in-law'}`;
    }
    if (stepTypes === 'partner-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'son-in-law' : 'daughter-in-law'}`;
    }
    if (stepTypes === 'to_parent-to_child-partner' || 
        stepTypes === 'to_parent-sibling-partner') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'brother-in-law' : 'sister-in-law'}`;
    }
  
    // Fallback description
    const terms = steps.map(step => {
      if (step.type === 'to_parent') return step.gender === 'Male' ? 'father' : 'mother';
      if (step.type === 'to_child') return step.gender === 'Male' ? 'son' : 'daughter';
      if (step.type === 'partner') return step.gender === 'Male' ? 'husband' : 'wife';
      if (step.type === 'sibling') return step.gender === 'Male' ? 'brother' : 'sister';
      return 'relative';
    });
    
    return `${getName(fromId)} is ${getName(toId)}'s ${terms.join(' of ')}`;
  };
  
  const handleFind = () => {
    if (!findForm.from || !findForm.to) return;
    const result = findRelationship(findForm.from, findForm.to);
    setFindForm(f => ({ ...f, result }));
  };
  
  // Keep all your existing checker functions exactly as they are:
  // checkStandardRelationships()
  // checkInLawRelationships() 
  // checkFamilyRelationships()
  // buildPathDescription()

 
  
  const checkStandardRelationships = (fromId, toId, steps, getName, fromGender) => {
    const stepTypes = steps.map(s => s.type).join('-');
    const stepGenders = steps.map(s => s.gender);
    
    // Parent
    if (stepTypes === 'to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${stepGenders[0] === 'Male' ? 'father' : 'mother'}`;
    }
    
    // Child
    if (stepTypes === 'to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'son' : 'daughter'}`;
    }
    
    // Grandparent
    if (stepTypes === 'to_parent-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${stepGenders[1] === 'Male' ? 'grandfather' : 'grandmother'}`;
    }
    
    // Grandchild
    if (stepTypes === 'to_child-to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'grandson' : 'granddaughter'}`;
    }
    
    // Sibling
    if (stepTypes === 'to_parent-to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'brother' : 'sister'}`;
    }
    
    return null;
  };
  
  const checkInLawRelationships = (fromId, toId, steps, getName, fromGender) => {
    const stepTypes = steps.map(s => s.type).join('-');
    const stepGenders = steps.map(s => s.gender);
    
    // Spouse
    if (stepTypes === 'partner') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'husband' : 'wife'}`;
    }
    
    // Parent-in-law
    if (stepTypes === 'to_parent-partner') {
      return `${getName(fromId)} is ${getName(toId)}'s ${stepGenders[1] === 'Male' ? 'father-in-law' : 'mother-in-law'}`;
    }
    
    // Child-in-law
    if (stepTypes === 'partner-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'son-in-law' : 'daughter-in-law'}`;
    }
    
    // Sibling-in-law
    if (stepTypes === 'to_parent-to_child-partner' || 
        stepTypes === 'to_parent-partner-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'brother-in-law' : 'sister-in-law'}`;
    }
    
    return null;
  };
  
  const checkFamilyRelationships = (fromId, toId, steps, getName, fromGender) => {
    const stepTypes = steps.map(s => s.type).join('-');
    const stepGenders = steps.map(s => s.gender);
    
    // Uncle/Aunt
    if (stepTypes === 'to_parent-to_child-partner') {
      const parentGender = stepGenders[0];
      return `${getName(fromId)} is ${getName(toId)}'s ${parentGender === 'Male' ? 'paternal' : 'maternal'} ${fromGender === 'Male' ? 'uncle' : 'aunt'}`;
    }
    
    // Nephew/Niece
    if (stepTypes === 'partner-to_child-to_child') {
      return `${getName(fromId)} is ${getName(toId)}'s ${fromGender === 'Male' ? 'nephew' : 'niece'}`;
    }
    
    // Cousin
    if (stepTypes === 'to_parent-to_child-to_child-to_parent') {
      return `${getName(fromId)} is ${getName(toId)}'s cousin`;
    }
    
    return null;
  };
  
  const buildPathDescription = (fromId, toId, steps, getName) => {
    const terms = steps.map(step => {
      if (step.type === 'to_parent') return step.gender === 'Male' ? 'father' : 'mother';
      if (step.type === 'to_child') return step.gender === 'Male' ? 'son' : 'daughter';
      if (step.type === 'partner') return step.gender === 'Male' ? 'husband' : 'wife';
      return 'relative';
    });
    
    return `${getName(fromId)} is ${getName(toId)}'s ${terms.join(' of ')}`;
  };

 
  

  const realPeople = nodes.filter(n => n.id);
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, border: '1px solid #ccc' }} ref={cyRef}></div>

      <div style={{ width: 300, padding: 20, borderLeft: '1px solid #ddd', overflowY: 'auto' }}>
        <button onClick={handleReset} style={{ ...btnStyle, background:'#dc3545' }}>Reset Tree</button>
        <button onClick={handleDelete} style={btnStyle} disabled={!selected}>Delete Node</button>

        {nodes.length === 0 ? (
          <>
            <h3>Create First Person</h3>
            <input placeholder="Name" value={firstForm.name} onChange={e=>setFirstForm(f=>({...f, name:e.target.value}))} style={inputStyle} />
            <select value={firstForm.gender} onChange={e=>setFirstForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
              <option>Other</option><option>Male</option><option>Female</option>
            </select>
            <input placeholder="Age" value={firstForm.age} onChange={e=>setFirstForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
            <input placeholder="DOB" value={firstForm.dob} onChange={e=>setFirstForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
            <button onClick={handleAddFirst} style={confirmStyle}>Add Person</button>
          </>
        ) : (
          <>
            <p><b>Selected:</b> {selected}</p>
            <div style={{ marginBottom: 10 }}>
              {['addParent','addPartner','addChild','addSibling','edit','freeNode'].map(m => (
                <button key={m} onClick={()=>setMode(m)} style={btnStyle}>
                  { { 
                    addParent:'Add Parent', 
                    addPartner:'Add Partner', 
                    addChild:'Add Child', 
                    addSibling:'Add Sibling', 
                    edit:'Edit Node',
                    freeNode: 'Add Free Node'
                  }[m] }
                </button>
              ))}
            </div>

            {mode==='addParent' && (
              <div style={panelStyle}>
                <h4>Add Parents</h4>
                <input placeholder="Father's Name" value={parentForm.father} onChange={e=>setParentForm(f=>({...f, father:e.target.value}))} style={inputStyle} />
                <input placeholder="Father's Age" value={parentForm.ageFather} onChange={e=>setParentForm(f=>({...f, ageFather:e.target.value}))} style={inputStyle} />
                <input placeholder="Father's DOB" value={parentForm.dobFather} onChange={e=>setParentForm(f=>({...f, dobFather:e.target.value}))} style={inputStyle} />
                <input placeholder="Mother's Name" value={parentForm.mother} onChange={e=>setParentForm(f=>({...f, mother:e.target.value}))} style={inputStyle} />
                <input placeholder="Mother's Age" value={parentForm.ageMother} onChange={e=>setParentForm(f=>({...f, ageMother:e.target.value}))} style={inputStyle} />
                <input placeholder="Mother's DOB" value={parentForm.dobMother} onChange={e=>setParentForm(f=>({...f, dobMother:e.target.value}))} style={inputStyle} />
                <button onClick={handleAddParent} style={confirmStyle}>Confirm</button>
              </div>
            )}

            {mode==='addPartner' && (
              <div style={panelStyle}>
                <h4>Add Partner</h4>
                <input placeholder="Partner's Name" value={partnerForm.newName} onChange={e=>setPartnerForm(f=>({...f, newName:e.target.value}))} style={inputStyle} />
                <select value={partnerForm.gender} onChange={e=>setPartnerForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
                  <option>Other</option><option>Male</option><option>Female</option>
                </select>
                <input placeholder="Partner's Age" value={partnerForm.age} onChange={e=>setPartnerForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
                <input placeholder="Partner's DOB" value={partnerForm.dob} onChange={e=>setPartnerForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
                <input list="people" placeholder="Or Select Existing" value={partnerForm.existingId} onChange={e=>setPartnerForm(f=>({...f, existingId:e.target.value}))} style={inputStyle}/>
                <datalist id="people">
                  {realPeople.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </datalist>
                <button onClick={handleAddPartner} style={confirmStyle}>Confirm</button>
              </div>
            )}

            {mode==='addChild' && (
              <div style={panelStyle}>
                <h4>Add Child</h4>
                <input placeholder="Child Name" value={childForm.name} onChange={e=>setChildForm(f=>({...f, name:e.target.value}))} style={inputStyle} />
                <select value={childForm.gender} onChange={e=>setChildForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
                  <option>Other</option><option>Male</option><option>Female</option>
                </select>
                <input placeholder="Child Age" value={childForm.age} onChange={e=>setChildForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
                <input placeholder="Child DOB" value={childForm.dob} onChange={e=>setChildForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
                <button onClick={handleAddChild} style={confirmStyle}>Confirm</button>
              </div>
            )}

            {mode==='addSibling' && (
              <div style={panelStyle}>
                <h4>Add Sibling</h4>
                <input placeholder="Sibling Name" value={childForm.name} onChange={e=>setChildForm(f=>({...f, name:e.target.value}))} style={inputStyle} />
                <select value={childForm.gender} onChange={e=>setChildForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
                  <option>Other</option><option>Male</option><option>Female</option>
                </select>
                <input placeholder="Sibling Age" value={childForm.age} onChange={e=>setChildForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
                <input placeholder="Sibling DOB" value={childForm.dob} onChange={e=>setChildForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
                <button onClick={handleAddSibling} style={confirmStyle}>Confirm</button>
              </div>
            )}

            {mode==='edit' && (
              <div style={panelStyle}>
                <h4>Edit Node</h4>
                <input placeholder="Name" value={editForm.name} onChange={e=>setEditForm(f=>({...f, name:e.target.value}))} style={inputStyle} />
                <select value={editForm.gender} onChange={e=>setEditForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
                  <option>Other</option><option>Male</option><option>Female</option>
                </select>
                <input placeholder="Age" value={editForm.age} onChange={e=>setEditForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
                <input placeholder="DOB" value={editForm.dob} onChange={e=>setEditForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
                <button onClick={handleEdit} style={confirmStyle}>Save Changes</button>
              </div>
            )}

            {mode==='freeNode' && (
              <div style={panelStyle}>
                <h4>Add Free Node</h4>
                <input placeholder="Name" value={freeNodeForm.name} onChange={e=>setFreeNodeForm(f=>({...f, name:e.target.value}))} style={inputStyle} />
                <select value={freeNodeForm.gender} onChange={e=>setFreeNodeForm(f=>({...f, gender:e.target.value}))} style={inputStyle}>
                  <option>Other</option><option>Male</option><option>Female</option>
                </select>
                <input placeholder="Age" value={freeNodeForm.age} onChange={e=>setFreeNodeForm(f=>({...f, age:e.target.value}))} style={inputStyle} />
                <input placeholder="DOB" value={freeNodeForm.dob} onChange={e=>setFreeNodeForm(f=>({...f, dob:e.target.value}))} style={inputStyle} />
                <button onClick={handleAddFreeNode} style={confirmStyle}>Add Node</button>
              </div>
            )}

            <div style={panelStyle}>
              <h4>Find Relation</h4>
              <input list="people" placeholder="From" value={findForm.from} onChange={e=>setFindForm(f=>({...f, from:e.target.value}))} style={inputStyle}/>
              <input list="people" placeholder="To" value={findForm.to} onChange={e=>setFindForm(f=>({...f, to:e.target.value}))} style={inputStyle}/>
              <datalist id="people">
                {realPeople.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </datalist>
              <button onClick={handleFind} style={confirmStyle}>Find Relationship</button>
              {findForm.result && (
                <div style={{ marginTop: 10, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
                  <strong>Relationship Path:</strong>
                  <p>{findForm.result}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Common Styles ---
const btnStyle = {
  display: 'inline-block', margin: '4px 4px 8px 0', padding: '6px 12px',
  background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'
};

const panelStyle = {
  border: '1px solid #ccc', padding: 12, marginTop: 12, borderRadius: 4, background: '#f9f9f9'
};

const inputStyle = {
  width: '100%', padding: 8, margin: '6px 0', boxSizing: 'border-box'
};

const confirmStyle = {
  width: '100%', padding: 10, marginTop: 8, background: '#28a745',
  color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'
};

export default App;