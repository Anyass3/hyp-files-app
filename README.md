# hyp-app

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

- after running the app for the first time
  -it will create a hyperbee which will be your database
  - then a hypercore which just logs your public drives key for now
  - then a public drive and private drive
  - also it will generate a settings.json file
     - for you should just edit the file system mount point
     - by default it's set to root `/`
 
- you can connect to remote hyperdrives
- see and preview the files in your drives, file system and also remote drives
- copy and paste files or folders between your file system or drives
  - but you cannot paste in remote drives because they are not writable
- or download a file or folder
- or if it's media you can watch or listen by streaming
- you can also view:
   - photos
   - pdfs are embed
   - text files
   - codes for various languages are syntax highlighted
   - 
   

## todos
- extract zip files
- upload files
- create new file or folder
- create temporal or disposible drives useful for sharing files
- sharing texts or files with hyperbeam or hyperswarm
  - connecting to remote peers with just a phrase
  - it's like it opens a temporal hole which closes as soon as file is received
- sort files/folders based on:
  - type
  - 0>9>a>z
  - z>a>9>0
  - 
- filter/search files/folders based on:
  - regex
  - name
  - ext
