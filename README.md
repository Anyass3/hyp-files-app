# hyp-files-app
[read about the in google Docs](https://docs.google.com/document/d/1fQzMs1ykgv3G-BIaiCB6dKrJvlZtI-ckZUtxjJ_YwjQ/edit?usp=sharing)

## runing app

#### frontend
```shell
npm run dev -- --host
```

#### backend
```shell
npm run server -- -h 0.0.0.0
```
# some notes

### after running the app for the first time
  -it will create a hyperbee which will be your database
  - then a hypercore logger which keeps your logs
  - then a public drive and private drive
  - also it will generate a settings.json file
     - you can edit the file system mount point, it's set to root `/`
     - set `log` to `true` if you want to see logs from logger in console
### features
you can:

- connect to remote hyperdrives
- see and preview the files in your drives, file system and also remote drives
- copy and paste files or folders between your file system or drives
  - > but you cannot paste in remote drives because they are not writable
- download a file or folder
- stream media files from file system or drives
- view:
   - photos
   - pdfs are embed
   - text files
   - codes for various languages(syntax highlighted)
   

## todos
- extract zip files
- upload files
- create new file or folder
- create temporal or disposible drives useful for sharing files
- sort files/folders based on:
  - type
  - 0>9>a>z
  - z>a>9>0
  - 
- filter/search files/folders based on:
  - regex
  - name
  - ext
