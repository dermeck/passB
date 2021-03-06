import {Map, Set} from 'immutable';
import {
  Card,
  CardContent,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
} from 'material-ui';
import {withStyles, StyleRules, WithStyles} from 'material-ui/styles';
import * as React from 'react';
import {connect} from 'react-redux';
import {compose} from 'recompose';
import {Interfaces, Symbols} from 'Container';
import {lazyInject} from 'Decorators/lazyInject';
import {Extension, Strategy} from 'InjectableInterfaces';
import {StoreContents} from 'InjectableInterfaces/State';
import {ExtensionName, StrategyName, StrategyType} from 'State/Interfaces';
import {
  disableExtension,
  enableExtension,
  setExtensionOptions,
} from 'State/Options/Actions';
import {
  ExtensionNameArgs,
  ExtensionOptionsArgs,
} from 'State/Options/Interfaces';
import {
  getAllExtensionOptions, getEnabledExtensions, getExtensionOptions,
} from 'State/Options/Selectors';
import {TypedMap} from 'State/Types/TypedMap';
import {OthersTab} from './OthersTab';
import {StrategyTab} from './StrategyTab';

type TabValue = 'Extensions' | 'Matcher' | 'Filler' | 'FileFormat' | 'other';

interface Props {
}

interface MappedProps {
  enabledExtensions: Set<ExtensionName>;
  extensionOptions: Map<ExtensionName, TypedMap<{}>>;
  strategyOptions: Map<StrategyType, Map<StrategyName, TypedMap<{}>>>;
  enableExtension: (args: ExtensionNameArgs) => void;
  disableExtension: (args: ExtensionNameArgs) => void;
  setExtensionOptions: (args: ExtensionOptionsArgs) => void;

}

interface State {
  selectedTab: TabValue;
}

const styles: StyleRules<'wrap' | 'breakBefore'> = {
  wrap: {
    flexWrap: 'wrap',
  },
  breakBefore: {
    pageBreakBefore: 'always',
    width: '100%',
  },
};

interface StrategyTabData {
  strategyType: StrategyType;
  strategies: Array<Strategy<{}>>;
  tabLabel: string;
}

class ClassLessAddonOptions extends React.Component<Props & MappedProps & WithStyles<keyof typeof styles>, State> {
  public state: State = {
    selectedTab: 'Extensions',
  };

  @lazyInject(Symbols.PassB)
  private passB: Interfaces.PassB;

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // TODO: better error handling
    console.error(error, info);
  }

  public render(): JSX.Element {
    const {
      selectedTab,
    } = this.state;
    const {
      classes,
      enabledExtensions,
      extensionOptions,
      // tslint:disable:no-shadowed-variable
      enableExtension,
      disableExtension,
      setExtensionOptions,
      // tslint:enable:no-shadowed-variable
    } = this.props;
    const passB = this.passB;

    const strategyTabs: StrategyTabData[] = [
      {strategyType: 'Matcher', strategies: passB.getAllMatchers(), tabLabel: 'options_tab_matchers'},
      {strategyType: 'FileFormat', strategies: passB.getAllFileFormats(), tabLabel: 'options_tab_file_formats'},
      {strategyType: 'Filler', strategies: passB.getAllFillers(), tabLabel: 'options_tab_fillers'},
    ];

    return (
      <div>
        <Tabs value={selectedTab} onChange={(event: object, value: TabValue) => this.setState({selectedTab: value})}>
          <Tab value="Extensions" label={browser.i18n.getMessage('options_tab_extensions')}/>
          {strategyTabs.map(({strategyType, tabLabel}: StrategyTabData) => (
            <Tab
              key={`tab_${strategyType}`}
              value={strategyType}
              label={browser.i18n.getMessage(tabLabel)}
            />
          ))}
          <Tab value="other" label={browser.i18n.getMessage('options_tab_other')}/>
        </Tabs>
        {selectedTab === 'Extensions' &&
        <List>
          {passB.getAllExtensions().map((extension: Extension<{}>) => {
            const extensionName = extension.name;
            const enabled = enabledExtensions.includes(extensionName);
            const OptionsPanel = extension.OptionsPanel;
            return (
              <ListItem
                key={extensionName}
                className={classes.wrap}
              >
                <Checkbox
                  checked={enabled}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>, newValue: boolean) =>
                    (newValue ? enableExtension : disableExtension)({extensionName})
                  }
                />
                <ListItemText primary={extensionName}/>
                {enabled && OptionsPanel && (
                  <Card className={classes.breakBefore}>
                    <CardContent>
                      <OptionsPanel
                        options={getExtensionOptions(extensionOptions, extension)}
                        updateOptions={(options: TypedMap<{}>) => setExtensionOptions({
                          extensionName,
                          options,
                        })}
                      />
                    </CardContent>
                  </Card>
                )}
              </ListItem>
            );
          })}
        </List>
        }
        {strategyTabs
          .filter(({strategyType}: StrategyTabData) => strategyType === selectedTab)
          .map(({strategyType, tabLabel, strategies}: StrategyTabData) =>
            (
              <StrategyTab
                key={`tabContents_${strategyType}`}
                label={tabLabel}
                strategies={strategies}
                strategyType={strategyType}
              />
            ))}
        {selectedTab === 'other' &&
          <OthersTab/>
        }
      </div>
    );
  }
}

export const AddonOptions: React.ComponentClass<Props> = compose(
  withStyles<keyof typeof styles>(styles),
  connect(
    (state: StoreContents) => ({
      enabledExtensions: getEnabledExtensions(state),
      extensionOptions: getAllExtensionOptions(state),
    }),
    {
      enableExtension,
      disableExtension,
      setExtensionOptions,
    },
  ),
)(ClassLessAddonOptions);
