# hyp-files-app

> # NEW UPDATES: [dev branch](https://github.com/Anyass3/hyp-files-app/tree/dev)
> 
> **Backend:**
>
> Updating to the latest hypercore, hyperdive-next, hyperswarm, @hyperswarm/dht etc
>
> Also working on my own custom hyperdrive(to be the similar nodejs fs api) https://github.com/Anyass3/hyperdrive-fs-api
>
> Using a custom [corestore/networker](https://github.com/Anyass3/corestore-networker) so I can use the lastest holepunch modules.
> 
> **Frontend:**
> 
> Using stable svelte-kit
> 
> UI updates pending

[Docs in google docs](https://docs.google.com/document/d/1fQzMs1ykgv3G-BIaiCB6dKrJvlZtI-ckZUtxjJ_YwjQ/edit?usp=sharing)

[PDF Docs](https://abu.zetaseek.com/file/hyp-files-app.pdf?place=localhost-2f686f6d652f6162752f46696c65732f6879702d66696c65732d617070)

[Demo Videos](https://abu.zetaseek.com/?q=files%2Fhyp-files)

## Install Dependencies
```shell
npm install
```

## Development

#### Frontend

```shell
npm run dev -- --host
```

#### Backend

```shell
npm run serve:dev:host
# or
npm run serve:dev
```

## Production

#### builds frontend and compiles backend typescipt

```shell
npm run build
```

#### Frontend

```shell
npm run preview -- --host
```

#### Backend

```shell
npm run serve -- --host
```
