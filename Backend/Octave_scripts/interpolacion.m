function y_est = interpolacion(method, points_str, x_predict)
    % Convertir puntos a vectores
    data = strsplit(points_str, ' ');
    X = []; Y = [];
    for i = 1:length(data)
        xy = strsplit(data{i}, ',');
        X(end+1) = str2num(xy{1});
        Y(end+1) = str2num(xy{2});
    end

    % Validación básica
    if numel(X) < 2
        error("Se necesitan al menos 2 puntos");
    end

    % seleccionar método
    if strcmp(method, 'linear')
        y_est = IntLineal(x_predict, X, Y);
    else
        y_est = PoliLagrange(x_predict, X, Y);
    end

    % ¡IMPRESIÓN PARA FLASK!
    printf('%f', y_est);  % Formato numérico con 6 decimales
endfunction

% lineal
function y = IntLineal(x, X, Y)
    for i = 1:numel(X)-1
        if x >= X(i) && x <= X(i+1)
            y = (Y(i+1)-Y(i))/(X(i+1)-X(i))*(x-X(i))+Y(i);
        endif
    endfor
endfunction

% lagrange
function y = PoliLagrange(x, X, Y)
    y = 0;
    for i = 1:numel(X)
        L = 1;
        for j = 1:numel(X)
            if j ~= i
                L = L*(x - X(j))/(X(i)-X(j));
            endif
        endfor
        y = y + L*Y(i);
    endfor
endfunction
