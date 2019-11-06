# Electron-React-ImageUpload


## Install


First, clone the repo via github:

```bash
git clone https://github.com/ReactDev2019/eletron-react-imgupload.git
```

And then install the dependencies with yarn.

```bash
$ cd electron-react-imgupload
$ yarn
```

## Run


```bash
$ yarn dev
```

## How it works

1. Input your login information.

![screen shot 2018-12-03 at 9 58 25 am](https://user-images.githubusercontent.com/39380399/49349519-e97c9600-f6e5-11e8-9875-e034289a0fbd.png)

2. If your confirm your login information, is displayed image management GUI.

  ![screen shot 2018-12-03 at 10 01 58 am](https://user-images.githubusercontent.com/39380399/49349541-087b2800-f6e6-11e8-9292-fa7f4cd449c4.png)
  
3. Pick a local directory to watch. Please click "Select Directory" button.

4. Enter an EventID and click "Start" button.

5. Copy the images you want to upload to the selected directory.
- If you copy images into selected directory, is uploaded thumbnail to your server automatically.

![uploading](https://user-images.githubusercontent.com/39380399/49349760-19786900-f6e7-11e8-9f06-1da6b687b16d.png)

-If uploaded thumbnail successfully, is displayed following message.

![screen shot 2018-12-03 at 10 33 27 am](https://user-images.githubusercontent.com/39380399/49349783-3b71eb80-f6e7-11e8-870c-45a379d37f40.png)

-If it is received request from sever, you can upload full size images.

![screen shot 2018-12-09 at 4 06 31 pm](https://user-images.githubusercontent.com/39380399/49694848-d463a380-fbcc-11e8-984f-446a6b8982e1.png)

-If full size image is uploaded, is displayed following images.

![screen shot 2018-12-09 at 4 15 34 pm](https://user-images.githubusercontent.com/39380399/49694937-b8accd00-fbcd-11e8-8beb-519c1499abe4.png)


- If there is image with same name in local DB, display following message.

![screen shot 2018-12-03 at 10 20 48 am](https://user-images.githubusercontent.com/39380399/49349603-555efe80-f6e6-11e8-85a1-437a0a287fad.png)

