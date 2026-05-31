import { render } from 'preact'
import { App } from './app'
import { boot } from './boot'

render(<App />, document.getElementById('kon-root')!)

void boot()
