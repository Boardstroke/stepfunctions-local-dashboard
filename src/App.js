import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Link,
  NavLink
} from "react-router-dom";
import { EndpointProvider } from "./context/EndpointContext";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateActivity from "./components/CreateActivity";
import CreateStateMachine from "./components/CreateStateMachine";
import DescribeActivity from "./components/DescribeActivity";
import DescribeExecution from "./components/DescribeExecution";
import DescribeStateMachine from "./components/DescribeStateMachine";
import GetActivityTask from "./components/GetActivityTask";
import GetExecutionHistory from "./components/GetExecutionHistory";
import ListActivities from "./components/ListActivities";
import ListExecutions from "./components/ListExecutions";
import ListStateMachines from "./components/ListStateMachines";
import ListTagsForResource from "./components/ListTagsForResource";
import StartExecution from "./components/StartExecution";
import SendTaskSuccess from "./components/SendTaskSuccess";
import SendTaskFailure from "./components/SendTaskFailure";
import SendTaskHeartbeat from "./components/SendTaskHeartbeat";
import StateMachineDiagram from "./components/StateMachineDiagram";

const menuItems = [
  {
    section: "State Machines",
    items: [
      { path: "/", label: "List State Machines", exact: true },
      { path: "/createStateMachine", label: "Create State Machine" },
      { path: "/describeStateMachine", label: "Describe State Machine" }
    ]
  },
  {
    section: "Executions",
    items: [
      { path: "/listExecutions", label: "List Executions" },
      { path: "/startExecution", label: "Start Execution" },
      { path: "/describeExecution", label: "Describe Execution" },
      { path: "/getExecutionHistory", label: "Execution History" }
    ]
  },
  {
    section: "Activities",
    items: [
      { path: "/listActivities", label: "List Activities" },
      { path: "/createActivity", label: "Create Activity" },
      { path: "/describeActivity", label: "Describe Activity" },
      { path: "/getActivityTask", label: "Get Activity Task" }
    ]
  },
  {
    section: "Tasks",
    items: [
      { path: "/sendTaskSuccess", label: "Send Task Success" },
      { path: "/sendTaskFailure", label: "Send Task Failure" },
      { path: "/sendTaskHeartbeat", label: "Send Task Heartbeat" }
    ]
  },
  {
    section: "Other",
    items: [{ path: "/listTagsForResource", label: "List Tags" }]
  }
];

function App() {
  return (
    <EndpointProvider>
      <div className="App">
        <ConnectionStatus />
        <Router>
          <div className="sidenav">
            <Link to="/" className="sidenav-header">
              <span className="sidenav-logo">⚡</span>
              <span className="sidenav-title">Step Functions</span>
            </Link>

            <nav className="sidenav-nav">
              {menuItems.map(section => (
                <div key={section.section} className="nav-section">
                  <div className="nav-section-title">{section.section}</div>
                  <div className="nav-section-items">
                    {section.items.map(item => (
                      <NavLink
                        key={item.path}
                        exact={item.exact}
                        to={item.path}
                        className="nav-item"
                        activeClassName="nav-item-active"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="main">
            {/* Home - List State Machines */}
            <Route exact path="/" component={ListStateMachines} />

            {/* State Machine Diagram */}
            <Route
              exact
              path="/state-machine/:arn"
              component={StateMachineDiagram}
            />

            {/* State Machines */}
            <Route
              exact
              path="/createStateMachine"
              component={CreateStateMachine}
            />
            <Route
              exact
              path="/describeStateMachine"
              component={DescribeStateMachine}
            />
            <Route
              exact
              path="/listStateMachines"
              component={ListStateMachines}
            />

            {/* Executions */}
            <Route exact path="/listExecutions" component={ListExecutions} />
            <Route exact path="/startExecution" component={StartExecution} />
            <Route
              exact
              path="/describeExecution"
              component={DescribeExecution}
            />
            <Route
              exact
              path="/getExecutionHistory"
              component={GetExecutionHistory}
            />

            {/* Activities */}
            <Route exact path="/listActivities" component={ListActivities} />
            <Route exact path="/createActivity" component={CreateActivity} />
            <Route
              exact
              path="/describeActivity"
              component={DescribeActivity}
            />
            <Route exact path="/getActivityTask" component={GetActivityTask} />

            {/* Tasks */}
            <Route exact path="/sendTaskSuccess" component={SendTaskSuccess} />
            <Route exact path="/sendTaskFailure" component={SendTaskFailure} />
            <Route
              exact
              path="/sendTaskHeartbeat"
              component={SendTaskHeartbeat}
            />

            {/* Other */}
            <Route
              exact
              path="/listTagsForResource"
              component={ListTagsForResource}
            />
          </div>
        </Router>
      </div>
    </EndpointProvider>
  );
}

export default App;
