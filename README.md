## Personal Blog built with Next.js

## Development

```
yarn run dev

# serve with PWA
yarn run server

```

## deploy using `gh-pages`

```
yarn run deploy
```

## Usage

### MDX

1. All Components imported into MDX must be written in `js`.
2. All React Statements must be separated using empty lines top and bottom.

    - ❌

    ```js
    import Recommend from "@/components/Recommend.js";
    <Recommend
      links={[
        {
          name: "sdf",
          slug: "sdfd",
        },
      ]}
    ></Recommend>;
    ```

    - :heavy_check_mark: 

    ```js
    import Recommend from "@/components/Recommend.js";

    <Recommend
      links={[
        {
          name: "sdf",
          slug: "sdfd",
        },
      ]}
    ></Recommend>;
    ```


