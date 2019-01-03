import mockAxios from 'jest-mock-axios';
import { ActionsObservable } from 'redux-observable';
import { toArray } from 'rxjs/operators';

import rootReducer from '../../..';
import { IStartupInfo } from '../../../../models/portal-models';
import { ArmObj, SiteConfig } from '../../../../models/WebAppModels';
import { getStartupInfoAction } from '../../../portal/actions';
import { RootState, Services } from '../../../types';
import { updateResourceId } from '../../actions';
import {
  fetchWebConfigFailure,
  fetchWebConfigRequest,
  fetchWebConfigSuccess,
  updateWebConfigFailure,
  updateWebConfigRequest,
  updateWebConfigSuccess,
} from './actions';
import { WEB_CONFIG_FETCH_FAILURE, WEB_CONFIG_FETCH_SUCCESS, WEB_CONFIG_UPDATE_FAILURE, WEB_CONFIG_UPDATE_SUCCESS } from './actionTypes';
import { fetchWebConfig, updateWebConfig } from './epics';
import reducer from './reducer';
import api from './webConfigApiService';

const testResult: ArmObj<SiteConfig> = {
  id: '',
  name: '',
  location: '',
  kind: '',
  properties: {
    scmType: 'testvalue',
  },
} as ArmObj<SiteConfig>;
describe('Slot Config Names Store Epics', () => {
  const successDeps = {
    webConfigApi: {
      fetchWebConfig: async (state: RootState): Promise<ArmObj<SiteConfig>> => {
        return testResult;
      },
      updateWebConfig: async (state: RootState, newConfig: ArmObj<SiteConfig>): Promise<ArmObj<SiteConfig>> => {
        return testResult;
      },
    },
  } as Services;

  const failDeps = {
    webConfigApi: {
      fetchWebConfig: async (state: RootState): Promise<ArmObj<SiteConfig>> => {
        throw new Error('failuremessage');
      },
      updateWebConfig: async (state: RootState, newConfig: ArmObj<SiteConfig>): Promise<ArmObj<SiteConfig>> => {
        throw new Error('failuremessage');
      },
    },
  } as Services;

  it('Sends Success Action with object on Successful Fetch', async () => {
    let action$ = ActionsObservable.of(fetchWebConfigRequest());
    const output$ = fetchWebConfig(action$, {} as any, successDeps);
    const actions = await output$.pipe(toArray()).toPromise();
    expect(actions.length).toBe(1);
    const action = actions[0];
    expect(action.type).toBe(WEB_CONFIG_FETCH_SUCCESS);
    if (action.type === WEB_CONFIG_FETCH_SUCCESS) {
      expect(action.webConfig.properties.scmType).toBe('testvalue');
    }
  });

  it('Sends Success Action with object on Successful Update', async () => {
    let action$ = ActionsObservable.of(updateWebConfigRequest(testResult));
    const output$ = updateWebConfig(action$, {} as any, successDeps);
    const actions = await output$.pipe(toArray()).toPromise();
    expect(actions.length).toBe(1);
    const action = actions[0];
    expect(action.type).toBe(WEB_CONFIG_UPDATE_SUCCESS);
    if (action.type === WEB_CONFIG_UPDATE_SUCCESS) {
      expect(action.webConfig.properties.scmType).toBe('testvalue');
    }
  });

  it('Sends Error Action with error on failed Fetch', async () => {
    let action$ = ActionsObservable.of(fetchWebConfigRequest());
    const output$ = fetchWebConfig(action$, {} as any, failDeps);
    const actions = await output$.pipe(toArray()).toPromise();
    expect(actions.length).toBe(1);
    const action = actions[0];
    expect(action.type).toBe(WEB_CONFIG_FETCH_FAILURE);
    if (action.type === WEB_CONFIG_FETCH_FAILURE) {
      expect(action.error.message).toBe('failuremessage');
    }
  });

  it('Sends Error Action with error on failed Update', async () => {
    let action$ = ActionsObservable.of(updateWebConfigRequest(testResult));
    const output$ = updateWebConfig(action$, {} as any, failDeps);
    const actions = await output$.pipe(toArray()).toPromise();
    expect(actions.length).toBe(1);
    const action = actions[0];
    expect(action.type).toBe(WEB_CONFIG_UPDATE_FAILURE);
    if (action.type === WEB_CONFIG_UPDATE_FAILURE) {
      expect(action.error.message).toBe('failuremessage');
    }
  });
});

describe('Slot Config Names Store Reducer', () => {
  const initialState = reducer(undefined, {} as any);
  describe('initial state', () => {
    it('should match a snapshot', () => {
      expect(initialState).toMatchSnapshot();
    });

    it('loading and updating should be false', () => {
      expect(initialState.metadata.loading).toBe(false);
      expect(initialState.metadata.updating).toBe(false);
    });
  });

  describe('Slot Config Names Fetch Stories', () => {
    it('should trigger loading when the fetch is requested', () => {
      const action = fetchWebConfigRequest();
      const state = reducer(initialState, action);
      expect(state.metadata.loading).toBe(true);
    });

    it('metadata and app settings should update on successful load', () => {
      const action = fetchWebConfigSuccess(testResult);
      const state = reducer(initialState, action);
      expect(state.metadata.loading).toBe(false);
      expect(state.data.properties.scmType).toBe('testvalue');
    });

    it('error should be reflected on failed load', () => {
      const action = fetchWebConfigFailure(new Error('testerror'));
      const state = reducer(initialState, action);
      expect(state.metadata.loading).toBe(false);
      expect(state.metadata.fetchError).toBe(true);
      expect(state.metadata.fetchErrorObject.message).toBe('testerror');
    });
  });

  describe('Slot Config Names Update Stories', () => {
    it('should trigger updating when the update is requested', () => {
      const action = updateWebConfigRequest(testResult);
      const state = reducer(initialState, action);
      expect(state.metadata.updating).toBe(true);
    });

    it('metadata and app settings should update on successful load', () => {
      const action = updateWebConfigSuccess(testResult);
      const state = reducer(initialState, action);
      expect(state.metadata.updating).toBe(false);
      expect(state.data.properties.scmType).toBe('testvalue');
    });

    it('error should be reflected on failed load', () => {
      const action = updateWebConfigFailure(new Error('testerror'));
      const state = reducer(initialState, action);
      expect(state.metadata.updating).toBe(false);
      expect(state.metadata.updateError).toBe(true);
      expect(state.metadata.updateErrorObject.message).toBe('testerror');
    });
  });
});

describe('Slot Config Names Service', () => {
  const initialState = rootReducer(undefined, {} as any);
  const catchFn = jest.fn();
  const thenFn = jest.fn();
  let state;
  beforeEach(() => {
    const updateResourceIdAction = updateResourceId('resourceid');
    const updateSUIAction = getStartupInfoAction({
      token: 'testtoken',
      armEndpoint: 'testEndpoint',
    } as IStartupInfo);

    state = rootReducer(rootReducer(initialState, updateResourceIdAction), updateSUIAction);
  });

  afterEach(() => {
    mockAxios.reset();
    thenFn.mockClear();
    catchFn.mockClear();
  });
  afterEach(() => {
    mockAxios.reset();
  });

  it('Fetch Api calls api with appropriate info', async () => {
    const fetcher = api.fetchWebConfig(state);
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'GET',
      url: 'testEndpointresourceid/config/web?api-version=2018-02-01',
      data: null,
      headers: {
        Authorization: `Bearer testtoken`,
      },
    });
    mockAxios.mockResponse({ data: testResult });
    const result = await fetcher;
    expect(result.properties.scmType).toBe('testvalue');
  });

  it('Update Api calls api with appropriate info', async () => {
    const fetcher = api.updateWebConfig(state, testResult);
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'PUT',
      url: 'testEndpointresourceid/config/web?api-version=2018-02-01',
      data: testResult,
      headers: {
        Authorization: `Bearer testtoken`,
      },
    });
    mockAxios.mockResponse({ data: testResult });
    const result = await fetcher;
    expect(result.properties.scmType).toBe('testvalue');
  });

  it('Fetch Api should throw on error', async () => {
    const fetcher = api
      .fetchWebConfig(state)
      .then(thenFn)
      .catch(catchFn);
    mockAxios.mockError(new Error('errorMessage'));
    await fetcher;
    expect(thenFn).not.toHaveBeenCalled();
    expect(catchFn).toHaveBeenCalled();
  });
  it('Update Api should throw on error', async () => {
    const fetcher = api
      .updateWebConfig(state, testResult)
      .then(thenFn)
      .catch(catchFn);
    mockAxios.mockError(new Error('errorMessage'));
    await fetcher;
    expect(thenFn).not.toHaveBeenCalled();
    expect(catchFn).toHaveBeenCalled();
  });
});