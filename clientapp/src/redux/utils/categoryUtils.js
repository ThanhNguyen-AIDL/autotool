import { useDispatch, useSelector } from "react-redux";
import {setCategoryList} from "@/redux/ducks/categoryDucks";

export const useCategories = () => {
    const dispatch = useDispatch();
  
    const { categories } = useSelector(state => state.category);
    const setCategories = async (list ) => {
        dispatch(setCategoryList(list));
        // await dispatch(fetchTokenDetail(pumpId)); // Initial fetch
    }


    return {
      categories,
      setCategories,
    };
};