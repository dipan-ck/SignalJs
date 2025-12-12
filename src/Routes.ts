


class Routes {
 routes : { method: string; path: string; handlers: Function[] }[] = []




get(path: string, ...handlers : Function[]) {
    this.routes.push({
        method : "GET",
        path,
        handlers
    })
}



post(path: string, ...handlers : Function[]) {
    this.routes.push({
        method : "POST",
        path,
        handlers
    })
}


}



export default Routes;