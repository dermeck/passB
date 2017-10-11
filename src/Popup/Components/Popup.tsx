import {LazyInject} from "Decorators/LazyInject";
import {Extension} from "Extensions";
import {PassB} from "PassB";
import {EntryView} from './Views/EntryView';
import {ListView} from './Views/ListView';

import {AppBar, Button, Card, CardContent, Toolbar, Typography} from "material-ui";
// import Settings from 'material-ui/svg-icons/action/settings'; TODO: 1.0 beta
import * as React from 'react';
import Tab = browser.tabs.Tab;
import {MemoryRouter, Route, RouteComponentProps, RouteProps, Switch} from "react-router";

interface State {
  activeTab?: Tab;
}

export class Popup extends React.Component<{}, State> {
  public state: State = {};
  private gatheredRoutes: RouteProps[] = this.gatherRoutes();

  @LazyInject(() => PassB)
  private passB: PassB;

  public componentDidMount(): void {
    browser.tabs.query({
      active: true,
      currentWindow: true,
    }).then((tabs: Tab[]) => this.setState({activeTab: tabs[0]}));
  }

  public render(): JSX.Element {
    const {activeTab} = this.state;

    return (
      <MemoryRouter>
        <div>
          <AppBar position="fixed">
            <Toolbar>
              <Typography type="title" color="inherit" style={{flex: 1, marginLeft: "15px"}}>
                {browser.i18n.getMessage('extensionName')}
              </Typography>
              <Button
                color="contrast"
                onClick={() => {
                  browser.runtime.openOptionsPage();
                  window.close();
                }}
              >
                Settings
              </Button>
            </Toolbar>
          </AppBar>
          <Card>
            <CardContent style={{maxHeight: '390px', overflow: 'auto'}}>
              <Switch>
                {this.gatheredRoutes.map((route: RouteProps) => <Route key={String(route.path)}  {...route} />)}
                <Route
                  path="/entry"
                  component={EntryView}
                />
                <Route
                  render={
                    ({history}: RouteComponentProps<{}>) => (
                      <ListView
                        navigateTo={(newUrl: string, state: {}) => history.push(newUrl, state)}
                        url={activeTab && activeTab.url ? activeTab.url : ''}
                      />
                    )}
                />
              </Switch>
            </CardContent>
          </Card>
        </div>
      </MemoryRouter>
    );
  }

  private gatherRoutes(): RouteProps[] {
    const gatheredRoutes: RouteProps[] = [];
    for (const extension of this.passB.getAllExtensions()) {
      for (const route of (extension.constructor as typeof Extension).routes) {
        if (!(route.path || '').startsWith(`/extension/${extension.name}/`)) {
          throw Error(
            `every route path for extension ${extension.name} has to start with "/extension/${extension.name}/"`,
          );
        }
        gatheredRoutes.push(route);
      }
    }

    return gatheredRoutes;
  }
}