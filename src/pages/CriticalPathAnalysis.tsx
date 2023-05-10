import React, { useState } from 'react';
import '../styles/critical-path.css';

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
    label: string;
    duration: number;
    earliestStart?: number; //To be filled in with calculate button
    latestStart?: number; //To be filled in with calculate button
    float?: number ; //To be filled in with calculate button
}

// just initialising this to avoid errors


const startActivity: Activity = {
    parents: [],
    children: [],
    label: "Start",
    duration: 0,
    earliestStart: 0,
    latestStart: 0,
    float: 0
}

const finishActivity = {
    parents: [startActivity],
    children: [],
    label: "Finish",
    duration: 0,
    float: 0
}

startActivity.children.push(finishActivity)

class ActivityNode {
    activity: Activity;
    selected: boolean;
    constructor(activity: Activity){
        this.activity = activity;
        this.selected = false;
    }

    toggleSelected(){
        this.selected = !this.selected;
    }

    isSelected(){
        return this.selected;
    }

    display(){
        return (
            <div className="activity-node">
                <div className="activity-attributes">
                    <div className="est-attribute">EST: {this.activity.earliestStart}</div>
                    <div className="lst-attribute">LST: {this.activity.latestStart}</div>
                </div>
                <div className="activity-name">{this.activity.label}</div>
                <div className="activity-details">
                    <div className="duration-attribute">Duration: {this.activity.duration}</div>
                    <div className="float-attribute">Float: {this.activity.float}</div>
                </div>
            </div>
        )
    }
}



export default function CriticalPathAnalysis(){
    const [startNode, setStartNode] = useState<ActivityNode>(new ActivityNode(startActivity))

    // I want an arrow connecting a parent node to a child node
    function showDiagram(){
        return (
            showNode(startNode)
        )
    }

    // This function will show a node, then show its children
    function showNode(node:ActivityNode){
        return (
            <div className='node-container'>
                <div className='node'>{node.display()}</div>
                {node.activity.children.map((child,index) => {
                    return (
                        <div className='children' key={index}>
                            {showNode(new ActivityNode(child))}
                        </div>
                    )
                    
                })}
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
                    <div className="activity-name"><input type="text" placeholder='Name'/></div>
                    <div className="activity-details">
                        <div className="duration-attribute"><input type="text" placeholder='Duration'/></div>
                        <div className="float-attribute">Float:</div>
                    </div>
                </div>
                <button className='add-button'>Add activity</button>
            </div>
            <div className="network-diagram">
                {showDiagram()}
            </div>
        </div>
    )
}