import {assign} from '../utils';
import {} from '../helpers';
import component from '../component';
import {Text} from './text';

export const Title = (selection, props) => {
  Text(selection, props);
};

Title.properties = assign({},
  Text.properties,
  {

  }
);

const title = component(Title);
export default title;
