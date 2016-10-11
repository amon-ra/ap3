import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Device} from 'ionic-native';

/* 
// on first load, use app-data.json file and save to localstorage.
// check if app needs update in background, set localstorage item
// on next load, if app needs update, go get new data and overwrite localstorage.
*/
@Injectable()
export class AppData {
  data: any = null;
  local: any = false;
  updateNeeded: boolean = false;

  constructor(public http: Http) {
    let item = window.localStorage.getItem( 'myappp' );
    this.local = JSON.parse( item );
  }

  load( apiurl ) {

    this.updateNeeded = ( window.localStorage.getItem( 'myappp_update' ) == 'true' ) ? true : false;

    if( Device.device.platform != 'iOS' && Device.device.platform != 'Android' ) {
      // if we are not on a device, don't cache data. helps preview update faster
      console.log('No device, bypass cache');
      this.updateNeeded = true;
    }

    return new Promise(resolve => {

      if( this.local && !this.updateNeeded ) {

        console.log('using localStorage data');

        // send back localstorage item
        resolve(this.local);

      } else if( !this.local && !this.updateNeeded ) {

        console.log('using app-data.json');

        // get local app-data file
        this.getData( 'app-data.json' ).then( data => {
          resolve(data);
        });

      } else {

        // get data from api
        this.getData( apiurl ).then( data => {
          resolve(data);
        });

      }

    });
  }

  getData( url: string ) {

    console.log('getting data from api ' + url );

    window.localStorage.removeItem( 'myappp' );

    return new Promise(resolve => {

      this.http.get( url )
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          this.local = window.localStorage.setItem( 'myappp', JSON.stringify(data) );
          resolve(data);
        });

    });
    
  }

  checkForUpdates( apiurl ) {

    let item = window.localStorage.getItem( 'myappp' );
    this.local = JSON.parse( item );

    // Runs in the background, and set the app to update on the next load
    // check if local app_update_version and remote version match, set updateNeeded accordingly

    this.http.get( apiurl )
      .map(res => res.json())
      .subscribe(data => {
        // we've got back the raw data, now generate the core schedule data
        // and save the data for later reference
        if( this.local.meta && data.meta && this.local.meta.app_update_version != data.meta.app_update_version ) {

          window.localStorage.setItem( 'myappp_update', 'true' );

        } else {

          window.localStorage.removeItem( 'myappp_update' );

        }
      });
  }
}
