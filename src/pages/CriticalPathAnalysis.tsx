import '../styles/critical-path.css';
import 'reactflow/dist/style.css';
import { useState, useCallback, useEffect, CSSProperties } from 'react';
import ReactFlow, { Controls, Background,applyEdgeChanges, applyNodeChanges, NodeChange, EdgeChange, addEdge, Handle, Position, Connection, Edge, useNodesState, useEdgesState, isEdge, getConnectedEdges, getIncomers, getOutgoers, CoordinateExtent, NodeHandleBounds, XYPosition } from 'reactflow';

// TODO finish add button

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
    id: number;
    parents: Activity[]; // Empty for start activity, at least one for all other activities
    children: Activity[]; // Empty for finish activity, at least one for all other activities
    activityLabel: string;
    duration: number;
    earliestStart?: number; //To be filled in with calculate button
    latestStart?: number; //To be filled in with calculate button
    float?: number ; //To be filled in with calculate button
    isHighlighted?: boolean;
}

// just initialising this to avoid errors


const startActivity: Activity = {
    id: 1,
    parents: [],
    children: [],
    activityLabel: "Start",
    duration: 0,
    earliestStart: 0,
    latestStart: 0,
    float: 0
}

const finishActivity = {
    id: 2,
    parents: [],
    children: [],
    activityLabel: "Finish",
    duration: 0,
    float: 0
}


function activityNode({data}: {data: Activity}) {
    return (
        <div className={data.isHighlighted ? "activity-node-highlighted" : "activity-node"}>
            { data.id !== 1 ? <Handle type="target" position={Position.Left} /> : null}
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

function getActivityFromID(id: number, activityList: Activity[]): Activity {
    for (let i = 0; i < activityList.length; i++) {
        if (activityList[i].id === id) {
            return activityList[i];
        }
    }
    throw new Error("Activity not found");

}

const nodeTypes = { ActivityNode: activityNode }



export default function CriticalPathAnalysis(){
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [activities, setActivities] = useState<Activity[]>([startActivity, finishActivity])
    const [newActivityID, setNewActivityID] = useState<number>(3);
    const [newActivity, setNewActivity] = useState<Activity>(
        {
            id: newActivityID,
            parents: [],
            children: [],
            activityLabel: "",
            duration: 0,
            float: 0
        }
    );
    
    useEffect(() => {
        function setAllNodes(){

            let result: any = []
            let childNumber = 0;
            let treeCount = -1;
            let idList:number[] = [] // Stores the IDs of nodes who have been added already

            function getChildLevel(currentActivity: Activity): number{
                if (currentActivity.parents.length === 0) {
                    return 0;
                }else{
                    return getChildLevel(currentActivity.parents[0]) + 1;
                }
            }

            function getPosition(currentActivity: Activity){
                const x = 200*getChildLevel(currentActivity);
                let y = 0;

                function isTaken(x: number, y: number){
                    return result.some((node: any) => node.position.x === x && node.position.y === y)
                }

                // If the position is taken, move it down 100 pixels until it is not taken
                while (isTaken(x, y)) {
                    y += 150;
                }

                return {x: x, y: y}
            }

        
            function pushChildren(currentActivity: Activity){
                if (idList.includes(currentActivity.id)) {
                    return
                }else{
                    // Reset childLevel and childNumber if we are starting a new tree
                    if (currentActivity.parents.length === 0) {
                        childNumber = 0;
                        treeCount++;
                    }
                    result.push({
                        id: currentActivity.id.toString(),
                        type: 'ActivityNode',
                        data: { ...currentActivity },
                        position: getPosition(currentActivity),
                        // eslint-disable-next-line eqeqeq
                        deletable: currentActivity.id == 1 || currentActivity.id == 2 ? false : true
                    })
                    idList.push(currentActivity.id)
            
                    currentActivity.children.forEach(child => {
                        
                        pushChildren(child)
                        childNumber++;
                    })
                }
            }
        
            
            // Map through all activities and push their children to the result array
            for (let i = 0; i < activities.length; i++) {
                pushChildren(activities[i])
            }

            // Result length should be equal to activities length. If not, there is a problem, throw an error
            if (result.length !== activities.length) {
                throw new Error("Error in setAllNodes - result length does not equal activities length")
            }
            return result
        }
        function setAllEdges(){
            const result:any = []
            
            let idList:number[] = [] // Stores the IDs of nodes who have had their edges added already
        
            function pushChildren(activity: Activity){
        
                if (!idList.includes(activity.id)) {
                    idList.push(activity.id)
                    activity.children.forEach(child => {
                        result.push({
                            id: `${activity.id}-${child.id}`,
                            source: activity.id.toString(),
                            target: child.id.toString(),
                            type: 'default'
                            
                        })
                        pushChildren(child)
                    })
                }
            }
            
            // Map through all activities and push their children to the result array
            activities.forEach(activity => {
                pushChildren(activity)
            })
    
            return result
        }
        setNodes(setAllNodes())
        setEdges(setAllEdges())
    }, [activities, setEdges, setNodes])
    
 
    const onConnect = useCallback(
    (connection: Edge | Connection) => {
        // Return if connection.source or connection.target is undefined
        if (connection.source === undefined || connection.target === undefined) {
            return;
        }
        // Get the source and target activities
        const source = getActivityFromID(parseInt(connection.source!), activities);
        const target = getActivityFromID(parseInt(connection.target!), activities);
        // Add the source as a parent of the target, add the target as a child of the source
        if (source !== target && !target.parents.includes(source)) {
            target.parents.push(source)
            source.children.push(target)
        }

        setEdges((eds) => addEdge(connection, eds))
    },
    [activities, setEdges]
    );

    const onNodesDelete = useCallback(
        (deleted: any[]) => {
          setEdges(
            deleted.reduce((acc: any[], node: { id: string; position: XYPosition; data: any; type: string | undefined; style: CSSProperties | undefined; className: string | undefined; sourcePosition: Position | undefined; targetPosition: Position | undefined; hidden: boolean | undefined; selected: boolean | undefined; dragging: boolean | undefined; draggable: boolean | undefined; selectable: boolean | undefined; connectable: boolean | undefined; deletable: boolean | undefined; dragHandle: string | undefined; width: number | null | undefined; height: number | null | undefined; parentNode: string | undefined; zIndex: number | undefined; extent: "parent" | CoordinateExtent | undefined; expandParent: boolean | undefined; positionAbsolute: XYPosition | undefined; ariaLabel: string | undefined; focusable: boolean | undefined; resizing: boolean | undefined; "__@internalsSymbol@120977": { z?: number | undefined; handleBounds?: NodeHandleBounds | undefined; isParent?: boolean | undefined; } | undefined; }) => {
              const incomers = getIncomers(node, nodes, edges);
              const outgoers = getOutgoers(node, nodes, edges);
              const connectedEdges = getConnectedEdges([node], edges);
    
              const remainingEdges = acc.filter((edge: Edge) => !connectedEdges.includes(edge));
    
              const createdEdges = incomers.flatMap(({ id: source }) =>
                outgoers.map(({ id: target }) => ({ id: `${source}->${target}`, source, target }))
              );
    
              return [...remainingEdges, ...createdEdges];
            }, edges)
          );

            // Remove the deleted node from the activities
            const deletedIDs = deleted.map(node => parseInt(node.id))
            setActivities(activities.filter(activity => !deletedIDs.includes(activity.id)))

            // Update the parent and child arrays of the activities
            activities.forEach(activity => {
                activity.parents = activity.parents.filter(parent => !deletedIDs.includes(parent.id))
                activity.children = activity.children.filter(child => !deletedIDs.includes(child.id))
            })



        },
        [setEdges, edges, nodes]
    );

    const onEdgesDelete = useCallback(
        (deleted: Edge[]) => {
            // Update the parent and child arrays of the activities
            deleted.forEach(edge => {
                const source = getActivityFromID(parseInt(edge.source), activities);
                const target = getActivityFromID(parseInt(edge.target), activities);
                if (source !== undefined && target !== undefined) {
                    source.children = source.children.filter(child => child !== target)
                    target.parents = target.parents.filter(parent => parent !== source)
                }
            }
            )
        }, [activities]
    )



    function setNewActivityName(event: React.ChangeEvent<HTMLInputElement>){
        setNewActivity({...newActivity, activityLabel: event.target.value})
    }

    function setNewActivityDuration(event: React.ChangeEvent<HTMLInputElement>){
        // Error checking
        if (isNaN(parseInt(event.target.value))) {
            alert("Please enter a number");
            // Clear the input
            event.target.value = "";
            return;
        }
    
        setNewActivity({...newActivity, duration: parseInt(event.target.value)})
    }

    function addNewActivity(){
        // Error checking
        if (newActivity.activityLabel === "") {
            alert("Please enter an activity name");
            return;
        }
        if (newActivity.duration === 0) {
            alert("Please enter a duration");
            return;
        }

        // Add the new activity to the list of activities
        setActivities([...activities, newActivity])
        
        // This should trigger a re-render, and the useEffect should update the nodes and edges
    
        // Reset the new activity
        
        setNewActivityID(newActivityID + 1)
        const newID = newActivityID + 1 // setNewActivityID doesn't update the state immediately, so we need to use a temporary variable 
        setNewActivity({
            id: newID,
            parents: [],
            children: [],
            activityLabel: "",
            duration: 0,
            float: 0
        })

        // Clear the input fields
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = "";
        })
    }

    function calculateCriticalPath(){
        // The start activity must be the only activity with no parents
        // Note: the start activity is always the first activity in the `activities` array
        // Iterate through the activities array (after the first element), if an activity has no parents, return false
        for (let i = 1; i < activities.length; i++) {
            if (activities[i].parents.length === 0) {
                alert("There must be exactly one start activity - ensure all activities have a path to the start activity");
                return;
            }
        }

        // The end activity must be the only activity with no children
        // Note: the end activity is always the second activity in the `activities` array
        // Iterate through the activities array (after the second element), if an activity has no children, return false
        for (let i = 2; i < activities.length; i++) {
            if (activities[i].children.length === 0) {
                alert("There must be exactly one finish activity - ensure all activities have a path to the end activity");
                return;
            }
        }

        // Now that we know there is only one tree, starting at the start activity and ending at the finish activity
        // We can arrange the activities, so that for each activity, all of its parents are before it, and all of its children are after it
        // We can do this by performing a breadth-first search, starting at the start activity
        // We will use a queue to keep track of the order of the activities
        // We will use a visited array to keep track of which activities we have visited
        let queue = [activities[0]]
        let visited: Activity[] = []
        while (queue.length > 0) {
            // Get the first activity in the queue
            const currentActivity = queue.shift()
            // Add it to the visited array if it isn't already there
            if (!visited.includes(currentActivity!))
                visited.push(currentActivity!)
            // Add its children to the queue
            queue = queue.concat(currentActivity!.children)
        }

        // Now the visited array contains the activities in the correct order
        // We can replace the activities array with the visited array
        let orderedActivites = visited //This is just for calculations - the order doesn't matter for the UI




        // Now we can calculate the critical path
        // First we conduct a forward pass to calculate the EST of each activity
        // The EST of the start activity is 0
        orderedActivites[0].earliestStart = 0
        // The EST of each subsequent activity is the maximum of the (EST + duration) of its parents
        for (let i = 1; i < orderedActivites.length; i++) {
            let maxEST = 0
            for (let j = 0; j < orderedActivites[i].parents.length; j++) {
                const parentEST = orderedActivites[i].parents[j].earliestStart
                const parentDuration = orderedActivites[i].parents[j].duration
                const parentESTPlusDuration = parentEST! + parentDuration
                if (parentESTPlusDuration > maxEST) {
                    maxEST = parentESTPlusDuration
                }
            }
            orderedActivites[i].earliestStart = maxEST
        }

        // Now we conduct a reverse pass to calculate the LST of each activity
        // The LST of the finish activity is the same as its EST

        orderedActivites[orderedActivites.length - 1].latestStart = orderedActivites[orderedActivites.length - 1].earliestStart
        // The LST of each subsequent activity is the minimum of the LST of its children, minus the duration of the current activity
        for (let i = orderedActivites.length - 2; i >= 0; i--) {
            let minLST = Infinity
            for (let j = 0; j < orderedActivites[i].children.length; j++) {
                const childLST = orderedActivites[i].children[j].latestStart
                if (childLST! < minLST) {
                    minLST = childLST!
                }
            }
            orderedActivites[i].latestStart = minLST - orderedActivites[i].duration
        }

        // Now we can calculate the float of each activity
        // The float of each activity is the difference between its LST and its EST
        for (let i = 0; i < orderedActivites.length; i++) {
            orderedActivites[i].float = orderedActivites[i].latestStart! - orderedActivites[i].earliestStart!
        }

        // Now we can calculate the critical path
        // The critical path is the path with no float
        // So we can find the paths from start to finish, where each activity has no float, and add them to an results array
        // We can use DFS to find the paths, backtracking when we find an activity with float
        let results: Activity[][] = []
        

        function findCriticalPaths(current_node: Activity, finish: Activity, visited:Activity[], path:Activity[]){
            visited.push(current_node)
            path.push(current_node)
            if (current_node === finish) {
                results.push([...path]) // We need to make a copy of the path, otherwise it will be overwritten
            }
            for (let i = 0; i < current_node.children.length; i++) {
                if (!visited.includes(current_node.children[i]) && current_node.children[i].float === 0) {
                    findCriticalPaths(current_node.children[i], finish, visited, path)
                }
            }
            visited.pop()
            path.pop()
        }

        findCriticalPaths(orderedActivites[0], orderedActivites[orderedActivites.length - 1], [], [])

        // Now we can update the state to reflect the changes and trigger a re-render
        // Set the isHighlighted property of each activity in the critical path (in the orderedActivities array) to true
        const criticalNodes = results.flat()
        let newActivityList = [...activities]
        newActivityList.forEach(activity => {
            if (criticalNodes.includes(activity)) {
                activity.isHighlighted = true
            } else {
                activity.isHighlighted = false
            }
        })

        setActivities(newActivityList)
    


    }
    
    function showDebug(): JSX.Element{
        const show = true
        if (!show) return (<div></div>)
        return(
            <div className='debug'>
                    <h2>Activities</h2>
                    <div className='debug-activities'>
                        {activities.map(activity => {
                            return(
                                <div className='debug-activity'>
                                    <div className='debug-activity-name'>Label: {activity.activityLabel}</div>
                                    <div className='debug-activity-duration'>Duration: {activity.duration} </div>
                                    <div className='debug-activity-est'>EST: {activity.earliestStart}</div>
                                    <div className='debug-activity-lst'>LST: {activity.latestStart}</div>
                                    <div className='debug-activity-float'>Float: {activity.float}</div>
                                    <div className='debug-activity-highlighted'>Critical: {activity.isHighlighted ? 'true' : 'false'}</div>
                                    <div className='debug-activity-parents'>Parents: {activity.parents.map(parent => parent.activityLabel)}</div>
                                    <div className='debug-activity-children'>Children: {activity.children.map(child => child.activityLabel)}</div>
                                    <hr></hr>
                                </div>    )
                        })}
                    </div>
            </div>
        )
    }


    return(
        <div className="critical-path">
            <h1>Critical Path Analysis</h1>
            <div className="add-activity">
                <div className="editable-activity-node">
                    <div className="activity-attributes">
                        <div className="est-attribute">EST: </div>
                        <div className="lst-attribute">LST: </div>
                    </div>
                    <div className="activity-name"><input type="text" placeholder='Name' onChange={setNewActivityName}/></div>
                    <div className="activity-details">
                        <div className="duration-attribute" onChange={setNewActivityDuration}><input type="text" placeholder='Duration'/></div>
                        <div className="float-attribute">Float:</div>
                    </div>
                </div>
                <button className='add-button' onClick={addNewActivity}>Add activity</button>
            </div>
            <div className="calculate-button">
                <button className='calculate-button' onClick={calculateCriticalPath}>Calculate</button>
            </div>
            Press backspace to remove an actvity, or an edge between two activities
            
            <div className="network-diagram">
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onConnect={onConnect}
                onNodesDelete={onNodesDelete}
            >
                <Background color='#6b6b87' style={{ backgroundColor: '#d5d5de' }}/>
                <Controls />
            </ReactFlow>
            </div>
        </div>
    )
}