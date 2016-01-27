import {createDraw, types} from '../helpers';
import component from '../component';

export const Title = createDraw({
  select(props) {

  },
  enter(props) {

  },
  update(props) {

  },
  merge(props) {

  },
  exit(props) {

  }
});

Title.properties = {
  text: types.string
};

const title = component(Title);
export default title;
