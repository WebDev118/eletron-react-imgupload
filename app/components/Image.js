import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'reactstrap';
import config from '../constants/config';
import  style from './Home.css';
import {ipcMain,ipcRenderer} from 'electron';
import { CopyFileTransformer } from 'builder-util/out/fs';
import util from 'util';
import { exec, spawn } from 'child_process';
import axios from 'axios';
import fs from 'fs';

class Image extends Component {
  constructor(props){
    super(props);

    this.state = {
      imgFolderPath: '',
      eventID: '',
      app_id:'',
      imgInfoSaveState: false,
      pusherNoti: true,
      imgUploading: false,
      stopButton: false
    }

    ipcRenderer.on('imageSave-reply', (event, arg) => {
      if(arg !== ''){
        this.thumbSend(arg);
      }
      else{
        alert("There is a file with the same name in the local DB.")
      }
    });
    ipcRenderer.on('getThumbdata-reply', (event, arg) => {
      this.sendThumbdata(arg);
    });
    
    ipcRenderer.on('pusher-notification', (event, arg) => {
      console.log("sadfsdfd")
      let state = arg.state;
      let data = arg.data[0];
      if(state === "ok"){
        let message = "You have received message from server.\n A full-size image with the following data will be uploaded:(server_id="+data.server_id+" remote_id="+data.event_id+").";
        let email = localStorage.getItem('email');
        let password = localStorage.getItem('password');
        let path = data.path;
        let imgfilename = data.filename;
        let full_path = path+"/"+imgfilename;
        let remote_id = data.remote_id;
        let event_id = data.event_id;
        let app_id = data.app_id;
        let server_id = data.server_id;
        let msg = confirm(message);

        if(msg){
          this.setState({imgUploading: true});
          let that = this;
          let command = "curl --verbose "+config.SITEURL+"/remote_images/"+server_id+" --user "+email+":"+password+" -F remote_image[photo_full]=@"+full_path+" -F remote_image[remote_id]="+remote_id+" -F remote_image[event_id]="+event_id+" -F remote_image[app_id]="+app_id+" -F _method=PUT";
          let child2 = exec(command, function(error, stdout, stderr){
            let response = JSON.parse(stdout);
            if(response.status === "ok"){
              alert("Successfully uploaded!");
              that.setState({imgUploading: false});
            }
          });
        }
      }
      if(state === "no"){
        alert("There is no data on Local DB.");
      }
   });
  }

  componentWillMount(){
    if(this.state.app_id === ''){
      const uuidv1 = require('uuid/v1');
      let app_id = uuidv1();
      ipcRenderer.send('uuid', app_id);
      ipcRenderer.on('uuid-reply', (event, arg) => {
        this.setState({app_id: arg});
      });
    } 
  }

  onChageEventId = (event) => {
    this.setState({
      eventID: event.target.value,
    })
  }

  handleKeyDown = function (e) {
    if (e.key === 'Enter' && e.shiftKey === false) {
      e.preventDefault();
    }
  }

  selectFolder = () => {
    ipcRenderer.send('selectDirectory');
    ipcRenderer.on('selectDirectory-reply', (event, arg) => {
      this.setState({
        imgFolderPath: arg,
      });
    });
  }

  startWatcher = () => {
    this.setState({stopButton:true});
    let path = this.state.imgFolderPath[0];
    let parent = this;
    class Stack {
      constructor() {
        this.items = [];
      }
      push(element) {
        this.items.push(element);
      }
      pop() {
        if (this.items.length === 0)
          return "Underflow";
        return this.items.pop();
      }
      peek() {
        return this.items[this.items.length - 1];
      }
      isEmpty() {
        return this.items.length === 0;
      }
    }

    let chokidar = require("chokidar");
    let stack = new Stack();

    global.watcher = chokidar.watch(path, {
      ignored: /[\/\\]\./,
      persistent: true,
      depth: 0,
      ignoreInitial: true,
    });
    global.watcher
    .on('ready', function () {
      onWatcherReady('Ready');
    })
    .on('add', function (path) {
      if (isImageFile(path)) {
        makeThumbnail(path);
      }
    });

    function onWatcherReady(logo) {
     console.log(logo)
    }

    function isImageFile(path) {
      const isImage = require('is-image');
      return isImage(path);
    }

    function getFileExtension(path) {
      return (path.split('.').pop()).toLowerCase();
    }

    function getFileName(path) {
      let filename = "";
      if (path) {
        let startIndex = (path.indexOf('\\') >= 0 ? path.lastIndexOf('\\') : path.lastIndexOf('/'));
        filename = path.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
          filename = filename.substring(1);
        }
      }
      return filename;
    }

    function makeThumbnail(path) {
      let imagePath = parent.state.imgFolderPath[0];
      let thumbPath =  imagePath.substring(0,imagePath.lastIndexOf('/'));
      let filename = getFileName(path);
      let fileExtension = getFileExtension(path);
      const fs = require('fs');
      const resizeImg = require('resize-img');
      fs.existsSync(thumbPath+'/thumbnail') || fs.mkdirSync(thumbPath+'/thumbnail');
      resizeImg(fs.readFileSync(path), {width: 200, height: 200}).then(buf => {
        fs.writeFileSync(thumbPath+'/thumbnail/'+filename, buf);
      });
      saveImginfo(filename);
    }

    function saveImginfo(filename){
      let imagePath = parent.state.imgFolderPath[0];
      let imgInfo = {
                      app_id: parent.state.app_id,
                      event_id: parent.state.eventID,
                      filename: filename,
                      path: imagePath
                    };
      ipcRenderer.send('imgSaveInfo', imgInfo);
    }
  }
  thumbSend = (filename) => {
    ipcRenderer.send('getThumbdata', filename);
  }

  sendThumbdata = (data) =>{
    let that = this;
    this.setState({imgUploading: true});
    let email = localStorage.getItem('email');
    let password = localStorage.getItem('password');
    let credentials = btoa(email + ':' + password);
    let basicAuth = 'Basic ' + credentials;
    for(let i = 0; i < data.length; i++){
      let that = this;
      let path = data[i].path;
      let imgfilename = data[i].filename;
      let thumbPath =  path.substring(0, path.lastIndexOf('/'));
      let thumb_path = thumbPath+'/thumbnail/'+imgfilename;
      let full_path = path+"/"+imgfilename;
      let remote_id = data[i].remote_id;
      let event_id = data[i].event_id;
      let app_id = data[i].app_id;

      let command1 = "curl "+config.SITEURL+"/remote_images --user "+email+":"+password+" -F remote_image[photo_thumb]=@"+thumb_path+" -F remote_image[remote_id]="+remote_id+" -F remote_image[event_id]="+event_id+" -F remote_image[app_id]="+app_id;

      let child1 = exec(command1, function(error, stdout1, stderr){
        let response1 = JSON.parse(stdout1);
        if(stdout1 === "bad_pin"){
          alert("Bad Pin");
        }
        else {
          
          let server_id = response1.server_id;
          if(response1.status === "ok"){
            let update_data = { "server_id": server_id, "remote_id": remote_id};
            ipcRenderer.send('serverid_update', update_data);
      
            let command2 = "curl --verbose "+config.SITEURL+"/remote_images/"+server_id+" --user "+email+":"+password+" -F remote_image[photo_full]=@"+full_path+" -F remote_image[remote_id]="+remote_id+" -F remote_image[event_id]="+event_id+" -F remote_image[app_id]="+app_id+" -F _method=PUT";
            let child2 = exec(command2, function(error, stdout2, stderr){
              let response2 = JSON.parse(stdout2);
              if(response2.status === "ok"){
                alert("Successfully uploaded!");
                that.setState({imgUploading: false});
              }
            });
          }
        }
      });
    }
  }
  stopWatcher = () => {
    this.setState({stopButton: false})
    global.watcher.close();
    window.location.reload();
  }
  logout = () => {
    localStorage.clear();
    this.props.props.history.push("/");
  }
  render(){
    return (
      <div>
        <Container>
          {this.state.imgUploading &&
            <div className={style.loader_container}>
              <div className={style.loader}></div>
            </div>
          }
           <Row>
            <Col sm="12" className="text-right pb-4 pt-1">
              <button type="button" className="btn btn-secondary btn-sm text-right" onClick={this.logout}>Logout</button>
            </Col>
          </Row>
          <Row>
            <Col sm="12" className="text-center pb-5 pt-3">
              <h1 className="text-primary">Image Management</h1>
            </Col>
          </Row>
          <Row>
            <Col sm="8">
              <input type="text" className="form-control" value={this.state.imgFolderPath} readOnly/>
            </Col>
            <Col sm="4">
              <Button color="success" className="w-100" onClick={ this.selectFolder }>Select Directory</Button>
            </Col>
          </Row>
          <Row className="py-4">
            <Col sm="8">
              <input type="text" className="form-control" value={this.state.eventID} placeholder="Enter Event ID" onChange={this.onChageEventId} onKeyDown={(e) => this.handleKeyDown(e)}/>
            </Col>
            <Col sm="4">
              {(this.state.imgFolderPath && this.state.eventID)?
                this.state.stopButton? <Button color="danger" className="w-100" onClick={this.stopWatcher}> Stop </Button>
                :<Button color="warning" className="w-100" onClick={this.startWatcher}> Start </Button>
                : <Button color="warning" className="w-100" disabled> Start </Button>
              }
            </Col>
          </Row>
        </Container>

      </div>
    );
  }
}
export default Image;