import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import AppBar from '@material-ui/core/AppBar';
import { Fragment as RouteFragment } from 'redux-little-router';
import Toolbar from './Toolbar';
import Map from './Map';
import ImageItems from './ImageItems';
import UploadForm from './UploadForm';

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  sidebar: {
    padding: theme.spacing.unit,
    color: theme.palette.text.secondary,
    marginTop: '70px'
  }
});

export const Container = (props) => {
  const { classes } = props;
  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        color="default"
        className={classes.appBar}
      >
        <Toolbar />
      </AppBar>
      <RouteFragment forRoute="/uploads">
        <UploadForm />
      </RouteFragment>
      <RouteFragment
        withConditions={
          location => location.route === '/'
          || location.route === '/imageitems/:imageId'
        }
      >
        <Grid container spacing={0}>
          <Grid
            className={classes.sidebar}
            item
            xs={12}
            sm={6}
            md={4}
          >
            <RouteFragment forRoute="/imageitems/:imageId">
              <div>
                items
              </div>
            </RouteFragment>
            <RouteFragment
              withConditions={
                location => location.route === '/'
              }
            >
              <ImageItems />
            </RouteFragment>
          </Grid>
          <Grid
            item
            xs={1}
            sm={6}
            md={8}
          >
            <Map />
          </Grid>
        </Grid>
      </RouteFragment>
    </div>
  );
};

Container.propTypes = {
  classes: PropTypes.shape({
    root: PropTypes.string.isRequired
  }).isRequired
};

export default withStyles(styles)(Container);
