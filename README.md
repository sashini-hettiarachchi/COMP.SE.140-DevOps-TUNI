
# Exercise 1

## docker container ls output
```
exercise1 % docker container ls
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS         PORTS                    NAMES
4b39441eb193   exercise1-service1   "docker-entrypoint.s…"   4 minutes ago   Up 4 minutes   0.0.0.0:8199->8199/tcp   exercise1-service1-1
27f80cdeb6c9   exercise1-service2   "python app.py && ps…"   4 minutes ago   Up 4 minutes                            exercise1-service2-1
```

## docker network ls output
```
exercise1 % docker network ls 
NETWORK ID     NAME                  DRIVER    SCOPE
613aaadfae92   bridge                bridge    local
401b520195f1   exercise1_mynetwork   bridge    local
c92251571c3f   host                  host      local
b7f93b43e171   none                  null      local
```