import { Map, fromJS } from 'immutable';
import bbox from '@turf/bbox';
import geoViewport from '@mapbox/geo-viewport';
import * as actions from '../constants/action_types';
import * as stylesheetConstants from '../constants/stylesheetConstants';

const buildFilters = (clusterIds, featureIds) => {
  let clusterFilter;
  if (clusterIds.length > 1) {
    clusterFilter = [
      '!',
      ['match',
        ['to-number', ['get', 'cluster_id']],
        clusterIds,
        true,
        false
      ]
    ];
  }

  const unclusteredPointFilter = [
    'all',
    ['!',
      ['has', 'point_count']
    ],
    ['match',
      ['to-string', ['get', 'id']],
      featureIds,
      false,
      true
    ]
  ];
  return { clusterFilter, unclusteredPointFilter };
};

const filterItems = (state, payload) => {
  const {
    clusterLayer,
    clusterCountLayer,
    unclusteredPointLayer
  } = stylesheetConstants;

  const {
    clusterFilter,
    unclusteredPointFilter
  } = buildFilters(payload.clusterIds, payload.featureIds);

  let clusterFilterState;
  const filterState = state
    .updateIn(['style', 'layers'], (list) => {
      const idx = list.findIndex(layer => layer.get('id') === unclusteredPointLayer);
      return list.setIn([idx, 'filter'], fromJS(unclusteredPointFilter));
    })
    .merge({ featureIds: fromJS(payload.featureIds) });

  if (clusterFilter) {
    clusterFilterState = filterState
      .updateIn(['style', 'layers'], (list) => {
        const idx = list.findIndex(layer => layer.get('id') === clusterLayer);
        return list.setIn([idx, 'filter'], fromJS(clusterFilter));
      })
      .updateIn(['style', 'layers'], (list) => {
        const idx = list.findIndex(layer => layer.get('id') === clusterCountLayer);
        return list.setIn([idx, 'filter'], fromJS(clusterFilter));
      });
  }
  return clusterFilterState || filterState;
};

const setFilteredDataSource = (state, payload) => {
  const { filteredItemsSource } = stylesheetConstants;
  const filteredFeatures = payload.json.features.filter(
    item => state.get('featureIds').find(id => id === item.properties.id)
  );
  const filteredFeatureCollection = {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: filteredFeatures
  };
  const bounds = bbox(filteredFeatureCollection);
  const clientSize = state.get('clientSize');
  const dimensions = [
    clientSize.get('clientWidth'),
    clientSize.get('clientHeight')
  ];
  const viewport = geoViewport.viewport(
    bounds,
    dimensions,
    undefined,
    undefined,
    512,
    true
  );
  const newState = state
    .setIn(['style', 'center'], fromJS(viewport.center))
    .setIn(['style', 'zoom'], viewport.zoom - 0.5)
    .setIn(['style', 'sources', filteredItemsSource, 'data'],
      fromJS(filteredFeatureCollection));

  return newState;
};

const initialState = Map({ style: fromJS({}) });

export default function stylesheetReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STYLE: {
      return state.merge({
        style: fromJS(action.payload.style)
      });
    }

    case actions.FILTER_ITEMS: {
      return filterItems(state, action.payload);
    }

    case actions.FETCH_FILTERED_ITEMS_SUCCEEDED: {
      return setFilteredDataSource(state, action.payload);
    }

    case actions.SET_CLIENT_SIZE: {
      return state.merge({
        clientSize: fromJS(action.payload)
      });
    }

    default: {
      return state;
    }
  }
}
