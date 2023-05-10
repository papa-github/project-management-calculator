import '../styles/critical-path.css';
import 'reactflow/dist/style.css';
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background,applyEdgeChanges, applyNodeChanges, NodeChange, EdgeChange, addEdge, Handle, Position, Connection, Edge, useNodesState, useEdgesState } from 'reactflow';

/*
How critical path analysis works:
1. Fill in activity attributes (label, duration)
2. Select 'Add activity' to add a new activity - which will be shown on the screen  unattached to any other activity
3. Select activities to create a network diagram
    3a. 'Start' and 'Finish' activity will be provided and fixed, user cannot delete these
    3b. Clicking two activities will create an arrow between them (clicking on the same activity twice will unselect it)
    3c. Clicking on an arrow will delete it
    
4. Press 'Calculate'
    4a. This will calculate the earliest start, finish times, and float for each activity - we ignore the latest start and finish times
    4b. The critical path will be highlighted in red
5. See results

*/

interface Activity {
    parents: Activity[]; // Empty for start activity, at least one for all other activities
    children: Activity[]; // Empty for finish activity, at least one for all other activities
    activityLabel: string;
    duration: number;
    earliestStart?: number; //To be filled in with calculate button
    latestStart?: number; //To be filled in with calculate button
    float?: number ; //To be filled in with calculate button
}

// just initialising this to avoid errors


const startActivity: Activity = {
    parents: [],
    children: [],
    activityLabel: "Start",
    duration: 0,
    earliestStart: 0,
    latestStart: 0,
    float: 0
}

const finishActivity = {
    parents: [startActivity],
    children: [],
    activityLabel: "Finish",
    duration: 0,
    float: 0
}

startActivity.children.push(finishActivity)

function activityNode({data}: {data: Activity}) {

    return (
        <div className="activity-node">
            <div className="activity-attributes">
                <div className="est-attribute">EST: {data.earliestStart}</div>
                <div className="lst-attribute">LST: {data.latestStart}</div>
            </div>
            <div className="activity-name">{data.activityLabel}</div>
            <div className="activity-details">
                <div className="duration-attribute">Duration: {data.duration}</div>
                <div className="float-attribute">Float: {data.float}</div>
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    )
}

const nodeTypes = { ActivityNode: activityNode }

const initialNodes = [
    {
      id: '1',
      type: 'ActivityNode',
      position: { x: 0, y: 0 },
      data: {...startActivity},
    },
    {
      id: '2',
      position: { x: 100, y: 100 },
      data: { label: 'World' },
    },
];

const initialEdges = [{ id: '1-2', source: '1', target: '2' }];



export default function CriticalPathAnalysis(){
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    
    useEffect(() => {
        setNodes([
            {
              id: '1',
              type: 'ActivityNode',
              data: { ...startActivity },
              position: { x: 0, y: 50 },
            }
        ])

    }, [])
    
 
      const onConnect = useCallback(
        (connection: Edge | Connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges]
      );


    return(
        <div className="critical-path">
            <h1>Critical Path Analysis</h1>
            <div className="add-activity">
                <div className="editable-activity-node">
                    <div className="activity-attributes">
                        <div className="est-attribute">EST: </div>
                        <div className="lst-attribute">LST: </div>
                    </div>
                    <div className="activity-name"><input type="text" placeholder='Name'/></div>
                    <div className="activity-details">
                        <div className="duration-attribute"><input type="text" placeholder='Duration'/></div>
                        <div className="float-attribute">Float:</div>
                    </div>
                </div>
                <button className='add-button'>Add activity</button>
            </div>
            <div className="network-diagram">
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            >
                <Background color='#6b6b87' style={{ backgroundColor: '#d5d5de' }}/>
                <Controls />
            </ReactFlow>
            </div>
        </div>
    )
}