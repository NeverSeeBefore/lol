import { Button } from "antd";
import React from "react";
import { Link } from "react-router-dom";
import {
  RouteComponentProps,
  withRouter,
} from "../../HOC/withRouter";
import "./index.sass";

interface IProps extends RouteComponentProps {
  testProp?: string;
}
interface IState {}

class Login extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    console.log('P-login', props);
  }
  render() {
    return (
      <div className="P-login">
        <h3>login page</h3>
        <Button
          type="primary"
          onClick={() => {
            this.props.navigate("/");
          }}
        >
          login
        </Button>
        <Link to="../test/a">link to ../test/a</Link>
      </div>
    );
  }
}
export default withRouter<IProps, React.ComponentType<IProps>>(Login);
