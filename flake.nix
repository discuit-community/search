{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.simpleFlake {
      inherit self nixpkgs;
      name = "search";
      shell =
        { pkgs }:
        pkgs.mkShell {
          buildInputs = [
            pkgs.meilisearch
            pkgs.sqlite
          ];
          shellHook = ''
            trap 'pkill -x meilisearch' EXIT
            if ! pgrep -x meilisearch >/dev/null; then
                DATE=$(date +%Y%m%d%H%M%S)
                LOG_FILE=".tmp/$DATE-meilisearch.log"

                # server configuration
                SERVER_PORT=3000

                # meilisearch configuration
                SEARCH_PORT=7700
                SEARCH_ADDR=127.0.0.1
                SEARCH_KEY=dev

                mkdir -p .tmp; echo "starting meilisearch..."
                nohup meilisearch \
                    --master-key $SEARCH_KEY --http-addr $SEARCH_ADDR:$SEARCH_PORT \
                    --no-analytics \
                    --db-path .tmp/meilisearch.db > $LOG_FILE 2>&1 &
                while ! grep -m1 "Server listening on" $LOG_FILE >/dev/null; do sleep 0.1; done # wait for meilisearch to start

                echo -e "meilisearch started at http://$SEARCH_ADDR:$SEARCH_PORT"
            fi
          '';
        };
    };
}
